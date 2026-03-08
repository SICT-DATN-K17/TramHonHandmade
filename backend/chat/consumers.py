import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from urllib.parse import parse_qs

from .models import ChatMessage, Chat
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.backends import TokenBackend
from .serializers import ChatMessageResponseSerializer


@sync_to_async
def is_user_participant(user, chat_id):
    """
    Kiểm tra xem user có phải là người tham gia cuộc trò chuyện không.
    Hàm này chạy bất đồng bộ để không block event loop.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    try:
        chat = Chat.objects.get(pk=chat_id)
        # Chỉ Admin hoặc người tham gia trong chat mới có quyền
        return user.is_staff or chat.customer == user or chat.artisan == user
    except Chat.DoesNotExist:
        return False


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        import logging
        logger = logging.getLogger(__name__)
        # Extract chat_id from URL route
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        logger.info(f'[WS] Connecting to {self.chat_group_name}')

        # Try to authenticate via JWT token passed in query string: ?token=...
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        logger.info(f'[WS] Token present: {bool(token)}')

        user = None
        if token:
            try:
                backend = TokenBackend(algorithm='HS256', signing_key=settings.SECRET_KEY)
                validated_data = backend.decode(token)
                user_id = validated_data.get('user_id')
                User = get_user_model()
                user = await sync_to_async(User.objects.get)(id=user_id)
                logger.info(f'[WS] Authenticated user {user_id}')
            except Exception as e:
                logger.error(f'[WS] Token auth failed: {e}')
                user = AnonymousUser()

        # Fallback to scope user (e.g., session auth)
        if not user or getattr(user, 'is_anonymous', False):
            user = self.scope.get('user', AnonymousUser())
            logger.info(f'[WS] Using scope user: {user}')

        self.user = user

        # Kiểm tra quyền truy cập vào chat room
        if await is_user_participant(self.user, self.chat_id):
            logger.info(f'[WS] User allowed, joining group {self.chat_group_name}')
            # Tham gia vào nhóm chat
            await self.channel_layer.group_add(
                self.chat_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f'[WS] Connection accepted for {self.chat_group_name}')
        else:
            logger.warning(f'[WS] User not allowed to access chat {self.chat_id}')
            # Từ chối kết nối nếu không có quyền
            await self.close()

    async def disconnect(self, close_code):
        # Rời khỏi nhóm chat
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    # Nhận tin nhắn từ WebSocket (không sử dụng để lưu)
    async def receive(self, text_data):
        # Consumer này không xử lý tin nhắn trực tiếp từ client; POST API chịu trách nhiệm lưu.
        return

    # Nhận tin nhắn từ group layer (do views.py gửi đến)
    async def chat_message(self, event):
        import logging
        logger = logging.getLogger(__name__)
        message = event['message']
        logger.info(f'[WS] Consumer.chat_message received from group: {message}')

        # Gửi tin nhắn đến WebSocket
        json_data = json.dumps(message)
        logger.info(f'[WS] Sending to client: {json_data}')
        await self.send(text_data=json_data)