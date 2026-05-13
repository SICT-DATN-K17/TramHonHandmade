from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Order, OrderItem
from products.models import Product
from chat.models import Chat
from users.models import CustomUser
import redis
from django.conf import settings
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)
redis_client = redis.StrictRedis.from_url(settings.CACHES['default']['LOCATION'], decode_responses=True)

def initialize_stock_in_redis(product_id, quantity):
    safe_qty = int(float(quantity))
    redis_client.set(f"product_stock_{product_id}", safe_qty)

def decrement_stock_redis(product_id, quantity_to_buy):
    stock_key = f"product_stock_{product_id}"
    
    current_val = redis_client.get(stock_key)
    
    if current_val is None:
        product = Product.objects.get(id=product_id)
        initialize_stock_in_redis(product.id, product.stock_quantity)
    elif '.' in str(current_val):
        initialize_stock_in_redis(product_id, current_val)
    
    current_stock = redis_client.decrby(stock_key, quantity_to_buy)
    
    if current_stock < 0:
        redis_client.incrby(stock_key, quantity_to_buy)
        return False
        
    return True

def refund_stock_redis(product_id, quantity_to_refund):
    stock_key = f"product_stock_{product_id}"
    current_val = redis_client.get(stock_key)
    
    if current_val is None:
        product = Product.objects.get(id=product_id)
        initialize_stock_in_redis(product.id, product.stock_quantity)
    elif '.' in str(current_val):
        initialize_stock_in_redis(product_id, current_val)
        
    safe_qty = int(float(quantity_to_refund))
    redis_client.incrby(stock_key, safe_qty)

def sync_order_to_odoo_sync(order):
    customer_search = odoo.execute('res.partner', 'search', [('x_django_id', '=', order.customer.id)])
    if customer_search:
        odoo_customer_id = customer_search[0]
    else:
        odoo_customer_id = odoo.execute('res.partner', 'create', {
            'name': order.customer.name,
            'email': order.customer.email,
            'phone': order.phone_number,
            'x_django_id': order.customer.id,
            'x_role': 'CUSTOMER'
        })

    odoo_artisan_id = False
    if order.artisan:
        artisan_search = odoo.execute('res.partner', 'search', [('x_django_id', '=', order.artisan.id)])
        if artisan_search:
            odoo_artisan_id = artisan_search[0]

    order_lines = []
    for item in order.items.all():
        if not item.product:
            continue
            
        template_search = odoo.execute('product.template', 'search', [('x_django_id', '=', item.product.id)])
        if template_search:
            product_search = odoo.execute('product.product', 'search', [('product_tmpl_id', '=', template_search[0])])
            if product_search:
                order_lines.append((0, 0, {
                    'product_id': product_search[0],
                    'product_uom_qty': item.quantity,
                    'price_unit': float(item.price_order),
                }))

    if not order_lines:
        raise ValueError(f"Order {order.id} không có sản phẩm nào khớp bên Odoo.")

    so_payload = {
        'partner_id': odoo_customer_id,
        'x_django_id': order.id,
        'x_artisan_id': odoo_artisan_id,
        'x_web_address': order.address,
        'x_web_phone': order.phone_number,
        'x_web_note': order.note or '',
        'x_payment_method': order.payment_method or '',
        'x_web_status': order.status,
        'order_line': order_lines,
    }
    
    odoo_so_id = odoo.execute('sale.order', 'create', so_payload)
    so_id = odoo_so_id[0] if isinstance(odoo_so_id, list) else odoo_so_id
    logger.info(f"Đã tạo Sale Order thành công trên Odoo: SO_ID = {so_id}")

    from orders.tasks import confirm_and_send_mail_odoo_task
    transaction.on_commit(lambda: confirm_and_send_mail_odoo_task.delay(so_id))

def update_order_status_in_odoo_sync(order, new_status):
    so_search = odoo.execute('sale.order', 'search', [('x_django_id', '=', order.id)])
    if so_search:
        so_id = so_search[0]
        odoo.execute('sale.order', 'write', [so_id], {'x_web_status': new_status})
        logger.info(f"Đã đồng bộ trạng thái {new_status} lên Odoo cho Order ID {order.id}")
    else:
        logger.warning(f"Không tìm thấy SO trên Odoo để update status cho Order {order.id}")

def cancel_order_in_odoo_sync(order, cancel_note):
    so_search = odoo.execute('sale.order', 'search', [('x_django_id', '=', order.id)])
    if not so_search:
        logger.warning(f"Không tìm thấy Sale Order cho Django Order {order.id} để hủy.")
        return

    so_id = so_search[0]
    
    if cancel_note:
        odoo.execute('sale.order', 'write', [so_id], {'x_web_status': 'CANCELLED', 'x_web_note': cancel_note})
    else:
        odoo.execute('sale.order', 'write', [so_id], {'x_web_status': 'CANCELLED'})
    
    so_data = odoo.execute('sale.order', 'read', [so_id], ['state', 'picking_ids'])[0]

    if so_data['state'] == 'cancel':
        return

    if so_data.get('picking_ids'):
        pickings = odoo.execute('stock.picking', 'read', so_data['picking_ids'], ['state'])
        for picking in pickings:
            if picking['state'] == 'done':
                moves = odoo.execute('stock.move', 'search_read', [
                    ('picking_id', '=', picking['id']), 
                    ('state', '=', 'done')
                ], ['product_id', 'quantity_done'])
                
                return_moves = []
                for move in moves:
                    if move.get('quantity_done', 0) > 0:
                        return_moves.append((0, 0, {
                            'product_id': move['product_id'][0],
                            'quantity': move['quantity_done'],
                            'move_id': move['id']
                        }))

                if not return_moves:
                    continue

                return_wizard_id = odoo.execute('stock.return.picking', 'create', {
                    'picking_id': picking['id'],
                    'product_return_moves': return_moves
                })
                return_res = odoo.execute('stock.return.picking', 'create_returns', [return_wizard_id])
                new_picking_id = return_res.get('res_id')
                
                if new_picking_id:
                    odoo.execute('stock.picking', 'action_assign', [new_picking_id])
                    new_moves = odoo.execute('stock.move', 'search', [('picking_id', '=', new_picking_id)])
                    for move_id in new_moves:
                        move_data = odoo.execute('stock.move', 'read', [move_id], ['product_uom_qty'])[0]
                        odoo.execute('stock.move', 'write', [move_id], {'quantity_done': move_data['product_uom_qty']})
                        
                    odoo.execute('stock.picking', 'button_validate', [new_picking_id])

    try:
        template_records = odoo.execute('ir.model.data', 'search_read', 
            [('module', '=', 'sale'), ('name', '=', 'mail_template_sale_cancellation')], 
            ['res_id']
        )
        template_id = template_records[0]['res_id'] if template_records else False

        wizard_vals = {'order_id': so_id}
        if template_id:
            wizard_vals['template_id'] = template_id

        cancel_wizard_id = odoo.execute('sale.order.cancel', 'create', wizard_vals)
        
        odoo.execute('sale.order.cancel', 'action_send_mail_and_cancel', [cancel_wizard_id])
        logger.info(f"Đã HỦY SO {so_id} và TỰ ĐỘNG GỬI EMAIL cho khách (Template ID: {template_id}).")
    except Exception as e:
        logger.warning(f"Không thể dùng wizard gửi mail, fallback về lệnh cancel gốc: {e}")
        odoo.execute('sale.order', 'action_cancel', [so_id])
        logger.info(f"Đã hủy SO {so_id} bằng action_cancel tiêu chuẩn.")

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
                current_val = redis_client.get(stock_key)
                
                if current_val is None:
                    initialize_stock_in_redis(product.id, product.stock_quantity)
                elif '.' in str(current_val):
                    initialize_stock_in_redis(product.id, current_val)
                
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
                chat.status = 'CLOSED'
                chat.save(update_fields=['status'])

            try:
                sync_order_to_odoo_sync(order)
            except Exception as e:
                logger.error(f"Lỗi đồng bộ Odoo khi tạo đơn: {e}")
                raise ValidationError("Lỗi hệ thống, vui lòng thử lại sau!")

            return order

    except Exception as e:
        for res_item in reserved_items:
            refund_stock_redis(res_item['product'].id, res_item['quantity'])
        raise e