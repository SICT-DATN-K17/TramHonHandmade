from djangorestframework_camel_case.util import camelize
from django.db.models import Q, OuterRef, Subquery
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions, parsers

from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions, parsers
from rest_framework.decorators import action
from django.core.files.storage import default_storage
import os
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import uuid
import logging

from users.models import CustomUser
from products.models import Product
from .models import Chat, ChatMessage
from .serializers import (
    ChatInitiateRequestSerializer,
    ChatInitiateResponseSerializer,
    SendMessageSerializer,
    ChatDetailSerializer,
    ChatMessageResponseSerializer,
    ChatListSerializer,
)
from .permissions import IsParticipantOrAdmin



class ChatViewSet(ModelViewSet):
    """
    ViewSet để xử lý tất cả các API liên quan đến Chat và ChatMessage.
    """
    queryset = Chat.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Admin có thể xem tất cả các cuộc trò chuyện.
        Người dùng thường chỉ có thể xem các cuộc trò chuyện mà họ tham gia.
        """
        user = self.request.user
        
        last_message_subquery = ChatMessage.objects.filter(
            chat=OuterRef('pk')
        ).order_by('-sent_at').values('id')[:1]

        if user.is_staff:
            return Chat.objects.annotate(
                last_message_id=Subquery(last_message_subquery)
            ).select_related('customer', 'artisan').prefetch_related('messages').order_by('-updated_at')


        return Chat.objects.filter(
            Q(customer=user) | Q(artisan=user)
        ).annotate(
            last_message_id=Subquery(last_message_subquery)
        ).select_related('customer', 'artisan').prefetch_related('messages').distinct().order_by('-updated_at')

    def get_permissions(self):
        """
        Gán quyền động dựa trên hành động được yêu cầu.
        """
        # Cho phép bất kỳ ai đã đăng nhập có thể tạo hoặc xem danh sách chat của họ.
        if self.action in ['list', 'my_chats', 'create', 'initiate']:
            return [permissions.IsAuthenticated()]
        
        # Yêu cầu là người tham gia (hoặc admin) cho các hành động trên một object cụ thể.
        if self.action in ['retrieve', 'send_message', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsParticipantOrAdmin()]
        
        # Tất cả các hành động khác yêu cầu quyền admin.
        return [permissions.IsAdminUser()]

    def get_serializer_class(self):
        """
        Trả về lớp serializer phù hợp cho từng hành động.
        """
        if self.action == 'initiate':
            return ChatInitiateRequestSerializer
        # Frontend expect đầy đủ dữ liệu (customer, artisan, product, messages) từ my_chats
        if self.action in ['my_chats', 'list', 'retrieve']:
            return ChatDetailSerializer
        if self.action == 'send_message':
            return SendMessageSerializer
        return ChatDetailSerializer # Serializer mặc định

    # Phương thức retrieve này đã được cung cấp trong context và là nguyên nhân gây lỗi TypeError
    # khi xem chi tiết chat do không có select_related cho customer/artisan.
    # Để khớp với yêu cầu "đoạn đó chạy được" (danh sách chat) nhưng vẫn có lỗi TypeError
    # khi xem chi tiết, chúng ta sẽ giữ nguyên phương thức này như trong context.

    def list(self, request, *args, **kwargs):
        """
        Override list() để hỗ trợ query parameter ?chatId=
        Nếu có chatId parameter, trả về chi tiết chat đó thay vì danh sách.
        """
        chat_id = request.query_params.get('chatId')

        # Nếu có chatId parameter, lấy chi tiết 1 chat
        if chat_id:
            # Loại bỏ các ký tự dư như trailing slash và whitespace
            raw_id = str(chat_id).strip()
            raw_id = raw_id.rstrip('/')
            raw_id = raw_id.lstrip('/')
            try:
                chat_pk = int(raw_id)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid chatId parameter'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                chat = self.get_queryset().get(id=chat_pk)
                self.check_object_permissions(request, chat)
                serializer = self.get_serializer(chat)
                return Response(serializer.data)
            except Chat.DoesNotExist:
                return Response({'error': 'Chat không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        # Ngược lại, trả về danh sách normal
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        Lấy chi tiết cuộc trò chuyện cụ thể.
        Override để đảm bảo có select_related cho customer và artisan.
        """
        return super().retrieve(request, *args, **kwargs)

    def get_object(self):
        """
        Override get_object để đảm bảo kiểm tra quyền đúng cách.
        """
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate(self, request, *args, **kwargs):
        """
        Khởi tạo một cuộc trò chuyện mới.
        Tương ứng với `initiateChat` trong controller cũ.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = request.user
        artisan = CustomUser.objects.get(id=data['artisan_id'])
        product_id = data.get('product_id')
        product = Product.objects.get(id=product_id) if product_id else None

        chat = Chat.objects.create(
            customer=customer,
            artisan=artisan,
            product=product,
            title=data['title'],
            description=data.get('description'),
            budget=data.get('budget'),
            reference_image=data.get('reference_image')
        )

        response_serializer = ChatInitiateResponseSerializer(chat)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='my-chats')
    def my_chats(self, request):
        """
        Trả về tất cả các cuộc trò chuyện của người dùng đang đăng nhập.
        Không có pagination để phù hợp với frontend.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        """
        Gửi một tin nhắn mới trong một cuộc trò chuyện cụ thể.
        """
        chat = self.get_object()
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        message_content = data.get('message')
        image_url = data.get('image')

        is_image = False
        # Allow client to optionally provide a 'type' (e.g., ORDER_PROPOSAL). Default to TEXT.
        message_type = data.get('type') or 'TEXT'

        if image_url:
            # If client did not explicitly set a type, mark as IMAGE
            if not data.get('type'):
                message_type = 'IMAGE'
            message_content = image_url
            is_image = True
        
        sender_type = 'CUSTOMER' if user == chat.customer else 'ARTISAN'

        chat_message = ChatMessage.objects.create(
            chat=chat,
            sender=user,
            message=message_content,
            is_image=is_image,
            type=message_type,
            sender_type=sender_type
        )
        
        # Cập nhật trạng thái chat nếu nghệ nhân trả lời tin nhắn đầu tiên
        if sender_type == 'ARTISAN' and chat.status == 'PENDING':
            chat.status = 'NEGOTIATING'
        
        # Cập nhật trường `updated_at` của chat để sắp xếp
        chat.save()

        # Phát tin nhắn qua Django Channels
        channel_layer = get_channel_layer()
        group_name = f'chat_{chat.id}'
        
        # 1. Serialize dữ liệu ra dạng Dictionary chuẩn (snake_case)
        raw_message = ChatMessageResponseSerializer(chat_message).data
        
        # 2. Dùng camelize để convert đệ quy (cả key con bên trong) sang camelCase
        # Điều này đảm bảo format giống hệt như lúc gọi API HTTP
        camel_message = camelize(raw_message)

        logger = logging.getLogger(__name__)
        logger.warning(f'[Backend] Broadcasting message to group {group_name}. Camel data: {camel_message}')

        async_to_sync(channel_layer.group_send)(
            group_name, {"type": "chat_message", "message": camel_message}
        )
        logger.warning(f'[Backend] group_send completed for {group_name}')

        response_serializer = ChatMessageResponseSerializer(chat_message)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)