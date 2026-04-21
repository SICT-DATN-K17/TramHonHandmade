from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Order, OrderItem
from products.models import Product
from chat.models import Chat
from users.models import CustomUser
import redis
from django.conf import settings
from orders.tasks import sync_order_to_odoo_task

redis_client = redis.StrictRedis.from_url(settings.CACHES['default']['LOCATION'], decode_responses=True)

def initialize_stock_in_redis(product_id, quantity):
    redis_client.set(f"product_stock_{product_id}", quantity)

def decrement_stock_redis(product_id, quantity_to_buy):
    stock_key = f"product_stock_{product_id}"
    
    if not redis_client.exists(stock_key):
        from products.models import Product 
        product = Product.objects.get(id=product_id)
        initialize_stock_in_redis(product.id, product.stock_quantity)
    
    current_stock = redis_client.decrby(stock_key, quantity_to_buy)
    
    if current_stock < 0:
        redis_client.incrby(stock_key, quantity_to_buy)
        return False
        
    return True

def refund_stock_redis(product_id, quantity_to_refund):
    stock_key = f"product_stock_{product_id}"
    redis_client.incrby(stock_key, quantity_to_refund)

def create_order_from_request(validated_data, user):
    items_data = validated_data.pop('items')

    if not user.is_authenticated:
        raise ValidationError("Người dùng phải đăng nhập để tạo đơn hàng.")
    customer = user

    artisan_id = validated_data.get('artisan_id')
    try:
        artisan = CustomUser.objects.get(id=artisan_id, role='ARTISAN')
    except CustomUser.DoesNotExist:
        raise ValidationError("Nghệ nhân được chỉ định không tồn tại hoặc tài khoản không hợp lệ.")

    chat_id = validated_data.get('chat_id')
    chat = None
    if chat_id:
        try:
            chat = Chat.objects.get(id=chat_id)
            if chat.customer != customer:
                raise ValidationError("Bạn không có quyền tạo đơn hàng từ cuộc hội thoại này.")
            if chat.artisan != artisan:
                raise ValidationError("Nghệ nhân của đơn hàng không khớp với cuộc hội thoại.")
        except Chat.DoesNotExist:
            raise ValidationError(f"Không tìm thấy cuộc hội thoại với ID: {chat_id}")

    reserved_items = []
    try:
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            if chat:
                stock_key = f"product_stock_{product.id}"
                if not redis_client.exists(stock_key):
                    initialize_stock_in_redis(product.id, product.stock_quantity)
                
                redis_client.decrby(stock_key, quantity)
                reserved_items.append({'product': product, 'quantity': quantity})
                
            else:
                if decrement_stock_redis(product.id, quantity):
                    reserved_items.append({'product': product, 'quantity': quantity})
                else:
                    raise ValidationError(f"Sản phẩm '{product.name}' (ID: {product.id}) đã hết hàng hoặc không đủ số lượng!")

        with transaction.atomic():
            total_price = 0
            products_to_update = []
            order_items_to_create = []

            for res_item in reserved_items:
                product = res_item['product']
                quantity = res_item['quantity']

                total_price += product.price * quantity
                
                product.quantity_sold += quantity
                products_to_update.append(product)

                order_items_to_create.append(
                    OrderItem(product=product, product_name=product.name, quantity=quantity, price_order=product.price)
                )
            initial_status = 'PENDING_PICKUP' if chat else 'PACKAGING'
            order = Order.objects.create(
                customer=customer, 
                artisan=artisan, 
                chat=chat, 
                total_price=total_price, 
                status=initial_status,
                **validated_data
            )

            for item in order_items_to_create:
                item.order = order

            OrderItem.objects.bulk_create(order_items_to_create)
            
            Product.objects.bulk_update(products_to_update, ['quantity_sold'])

            if chat:
                chat.status = 'ORDER_CREATED'
                chat.save(update_fields=['status'])

            sync_order_to_odoo_task.delay(order.id)

            return order

    except Exception as e:
        for res_item in reserved_items:
            refund_stock_redis(res_item['product'].id, res_item['quantity'])
        raise e