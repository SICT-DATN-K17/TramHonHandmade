from rest_framework import serializers

from users.models import CustomUser
from products.models import Product
from .models import Chat, ChatMessage


class ChatInitiateRequestSerializer(serializers.Serializer):
    artisan_id = serializers.IntegerField()
    product_id = serializers.IntegerField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    budget = serializers.DecimalField(max_digits=20, decimal_places=2, required=False, allow_null=True)
    reference_image = serializers.ImageField(required=False, allow_null=True, use_url=True)

    def validate_artisan_id(self, value):
        """Kiểm tra nghệ nhân có tồn tại và có đúng vai trò không."""
        # Sử dụng filter().exists() để tối ưu và gọn hơn là dùng try-except
        if not CustomUser.objects.filter(pk=value, role='ADMIN').exists():
            raise serializers.ValidationError("Nghệ nhân không tồn tại.")
        return value

    def validate_product_id(self, value):

        """Kiểm tra sản phẩm có tồn tại không (nếu được cung cấp)."""
        if value and not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Sản phẩm không tồn tại.")
        return value

    def validate(self, data):
        """Kiểm tra người dùng không tự tạo chat với chính mình."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.id == data.get('artisan_id'):
                raise serializers.ValidationError("Bạn không thể tự tạo cuộc trò chuyện với chính mình.")
        return data


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)
    type = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Đảm bảo có ít nhất một trong hai: tin nhắn văn bản hoặc hình ảnh."""
        if not data.get('message') and not data.get('image'):
            raise serializers.ValidationError("Phải có nội dung tin nhắn hoặc hình ảnh.")
        return data


class ChatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'name', 'email']

class ChatProductSerializer(serializers.ModelSerializer):
    # image = serializers.CharField(source='image.url', read_only=True, allow_null=True) # Hoàn nguyên dòng này
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image']

class ChatMessageResponseSerializer(serializers.ModelSerializer):
    sender_id = serializers.ReadOnlyField(source='sender.id')
    created_at = serializers.DateTimeField(source='sent_at', read_only=True)
    image = serializers.BooleanField(source='is_image', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_id', 'sender_type', 'image', 'type', 'message', 'created_at']


class ChatListSerializer(serializers.ModelSerializer):
    """
    Serializer rút gọn cho danh sách các cuộc trò chuyện.
    Hiển thị thông tin người tham gia còn lại và tin nhắn cuối cùng.
    """
    participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'title', 'status', 'participant', 'last_message', 'updated_at']

    def get_participant(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            participant_user = obj.artisan if obj.customer == user else obj.customer
            return ChatUserSerializer(participant_user).data
        return None

    def get_last_message(self, obj):
        """
        Lấy tin nhắn cuối cùng của cuộc trò chuyện.
        Sử dụng annotation last_message_id từ view để xác định tin nhắn.
        """
        try:
            # Kiểm tra xem obj có thuộc tính last_message_id không (từ annotation)
            if hasattr(obj, 'last_message_id') and obj.last_message_id:
                last_msg = obj.messages.filter(id=obj.last_message_id).first()
                if last_msg:
                    return ChatMessageResponseSerializer(last_msg).data
            # Nếu không, lấy tin nhắn mới nhất từ ordered queryset
            last_msg = obj.messages.all().order_by('-sent_at').first()
            if last_msg:
                return ChatMessageResponseSerializer(last_msg).data
        except:
            pass
        return None


class ChatDetailSerializer(serializers.ModelSerializer):
    # Sử dụng nested serializer trực tiếp thay vì SerializerMethodField
    # Điều này đảm bảo customer/artisan luôn được serialize đúng cách
    customer = ChatUserSerializer(read_only=True)
    artisan = ChatUserSerializer(read_only=True)
    product = ChatProductSerializer(read_only=True, allow_null=True)
    messages = ChatMessageResponseSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = [
            'id', 'customer', 'artisan', 'product', 'status', 'title',
            'description', 'budget', 'reference_image', 'created_at', 'messages'
        ]


class ChatInitiateResponseSerializer(serializers.Serializer):
    chat_id = serializers.IntegerField(source='id')
    artisan_id = serializers.IntegerField(source='artisan.id')
    artisan_name = serializers.CharField(source='artisan.name')
    status = serializers.CharField()
    socket_topic = serializers.SerializerMethodField()

    def get_socket_topic(self, obj):
        return f"/topic/chat/{obj.id}"
