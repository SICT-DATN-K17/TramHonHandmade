from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import *
from products.models import Product


class OrderItemRequestSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product')
    quantity = serializers.IntegerField(min_value=1, error_messages={'min_value': 'Số lượng phải lớn hơn 0'})


class OrderRequestSerializer(serializers.Serializer):
    # customer_id sẽ được lấy từ token hoặc mặc định trong view
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    artisan_id = serializers.IntegerField(required=True, error_messages={'required': 'Thiếu ID của Nghệ nhân (artisan_id)'})
    chat_id = serializers.IntegerField(required=False, allow_null=True)

    phone_number = serializers.RegexField(
        regex=r'^0\d{9}$',
        max_length=10,
        error_messages={
            'invalid': 'Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng số 0)',
            'max_length': 'Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng số 0)'
        }
    )
    address = serializers.CharField(min_length=10, error_messages={'min_length': 'Địa chỉ phải chi tiết hơn (tối thiểu 10 ký tự)'})
    note = serializers.CharField(max_length=200, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=['COD', 'ONLINE'], error_messages={'invalid_choice': 'Phương thức thanh toán không hợp lệ'})
    items = OrderItemRequestSerializer(many=True, min_length=1, error_messages={'min_length': 'Giỏ hàng không được để trống'})


class OrderDetailItemSerializer(ModelSerializer):
    product_id = serializers.ReadOnlyField(source='product.id')
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.ReadOnlyField(source='product.image')
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product_id', 'product_name', 'product_image', 'quantity', 'price_order', 'subtotal']

    def get_subtotal(self, obj):
        return obj.price_order * obj.quantity


class OrderDetailSerializer(ModelSerializer):
    chat_id = serializers.ReadOnlyField(source='chat.id')
    customer_name = serializers.ReadOnlyField(source='customer.name')
    customer_phone = serializers.ReadOnlyField(source='phone_number')
    shipping_address = serializers.ReadOnlyField(source='address')
    order_date = serializers.DateTimeField(source='created_at')
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_total = serializers.ReadOnlyField(source='total_price') 
    items = OrderDetailItemSerializer(many=True, read_only=True)
    artisan_id = serializers.ReadOnlyField(source='artisan.id')
    artisan_name = serializers.ReadOnlyField(source='artisan.name')

    class Meta:
        model = Order
        fields = [
            'id', 'chat_id', 'status', 'total_price', 'payment_method',
            'shipping_address', 'customer_name', 'customer_phone', 'note',
            'shipping_fee', 'order_date', 'final_total', 'items',
            'artisan_id', 'artisan_name'
        ]


class AdminOrderItemListSerializer(ModelSerializer):
    product_id = serializers.ReadOnlyField(source='product.id')
    product_name = serializers.ReadOnlyField(source='product.name')
    image = serializers.ReadOnlyField(source='product.image')
    price = serializers.ReadOnlyField(source='price_order')

    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_name', 'quantity', 'price', 'image']


class AdminOrderListSerializer(ModelSerializer):
    order_number = serializers.SerializerMethodField()
    customer_name = serializers.ReadOnlyField(source='customer.name')
    phone = serializers.ReadOnlyField(source='phone_number')
    created_at = serializers.DateTimeField()
    subtotal = serializers.SerializerMethodField()
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = serializers.ReadOnlyField(source='total_price')
    shipping_address = serializers.ReadOnlyField(source='address')
    items = AdminOrderItemListSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'phone', 'status',
            'created_at', 'subtotal', 'shipping_fee', 'total',
            'payment_method', 'shipping_address', 'note', 'items'
        ]

    def get_order_number(self, obj):
        return f'ART-{obj.id}'

    def get_subtotal(self, obj):
        # Tính subtotal bằng cách duyệt qua các order_item
        return sum(item.price_order * item.quantity for item in obj.items.all())


class OrderProgressItemSerializer(ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    image_url = serializers.ReadOnlyField(source='product.image')
    price = serializers.ReadOnlyField(source='price_order')

    class Meta:
        model = OrderItem
        fields = ['product_name', 'quantity', 'price', 'image_url']