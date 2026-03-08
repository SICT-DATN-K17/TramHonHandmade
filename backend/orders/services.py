from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Order, OrderItem
from products.models import Product
from chat.models import Chat
from users.models import CustomUser


def create_order_from_request(validated_data, user):
    """
    Creates an order and its items from validated serializer data.
    Handles stock reduction and chat status updates within a transaction.
    """
    items_data = validated_data.pop('items')

    if not user.is_authenticated:
        raise ValidationError("Người dùng phải đăng nhập để tạo đơn hàng.")
    customer = user

    try:
        # Default artisan to user with ID 1 as per old backend logic
        artisan = CustomUser.objects.get(id=validated_data.get('artisan_id', 1))
    except CustomUser.DoesNotExist:
        raise ValidationError("Nghệ nhân được chỉ định không tồn tại.")

    chat_id = validated_data.get('chat_id')
    chat = None
    if chat_id:
        try:
            chat = Chat.objects.get(id=chat_id)
            if chat.customer != customer:
                raise ValidationError("Bạn không có quyền tạo đơn hàng từ cuộc hội thoại này.")
        except Chat.DoesNotExist:
            raise ValidationError(f"Không tìm thấy cuộc hội thoại với ID: {chat_id}")

    with transaction.atomic():
        total_price = 0
        products_to_update = []
        order_items_to_create = []

        product_ids = [item['product'].id for item in items_data]
        products = Product.objects.in_bulk(product_ids)

        for item_data in items_data:
            product = products.get(item_data['product'].id)
            quantity = item_data['quantity']

            if not product:
                raise ValidationError(f"Sản phẩm với ID {item_data['product'].id} không tồn tại.")

            if product.stock_quantity < quantity:
                raise ValidationError(f"Sản phẩm '{product.name}' không đủ số lượng tồn kho.")

            total_price += product.price * quantity
            product.stock_quantity -= quantity
            product.quantity_sold += quantity
            products_to_update.append(product)

            order_items_to_create.append(
                OrderItem(product=product, product_name=product.name, quantity=quantity, price_order=product.price)
            )

        order = Order.objects.create(customer=customer, artisan=artisan, chat=chat, total_price=total_price, **validated_data)

        for item in order_items_to_create:
            item.order = order

        OrderItem.objects.bulk_create(order_items_to_create)
        Product.objects.bulk_update(products_to_update, ['stock_quantity', 'quantity_sold'])

        if chat:
            chat.status = 'ORDER_CREATED'
            chat.save(update_fields=['status'])

        return order