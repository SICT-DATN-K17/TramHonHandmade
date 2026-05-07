from celery import shared_task
from django.apps import apps
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def sync_order_to_odoo_task(self, order_id):
    try:
        Order = apps.get_model('orders', 'Order')
        order = Order.objects.get(id=order_id)

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
            logger.error(f"Order {order_id} không có sản phẩm nào khớp bên Odoo. Hủy sync!")
            return

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
        logger.info(f"Đã tạo Sale Order thành công trên Odoo: SO_ID = {odoo_so_id}")

        try:
            so_id = odoo_so_id[0] if isinstance(odoo_so_id, list) else odoo_so_id
            odoo.execute('sale.order', 'action_confirm', [so_id])
            logger.info(f"Đã Confirm Sale Order {order_id}. Phiếu xuất kho đã được Odoo tự động tính toán!")

            try:
                template_records = odoo.execute('mail.template', 'search', [
                    ('id', '=', 12)
                ])
                template_id = template_records[0] if template_records else False

                if template_id:
                    odoo.execute('mail.template', 'send_mail', [template_id], so_id, True)
                    logger.info(f"Đã TỰ ĐỘNG GỬI EMAIL Xác nhận cho SO {so_id} (Template ID: {template_id}).")
                else:
                    logger.warning("Không tìm thấy mẫu email tên 'Bán hàng: Xác nhận đơn hàng' trong Odoo!")

            except Exception as mail_err:
                logger.error(f"Lỗi khi gửi email xác nhận cho SO {so_id}: {mail_err}")

        except Exception as stock_err:
            logger.warning(f"Đã tạo SO nhưng lỗi lúc confirm: {stock_err}")

        return f"Sync Order {order_id} to Odoo success!"

    except Exception as exc:
        logger.error(f"Lỗi sync Order ID {order_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=3)
def cancel_order_in_odoo_task(self, order_id):
    try:
        Order = apps.get_model('orders', 'Order')
        order = Order.objects.get(id=order_id)

        so_search = odoo.execute('sale.order', 'search', [('x_django_id', '=', order.id)])
        if not so_search:
            logger.warning(f"Không tìm thấy Sale Order cho Django Order {order.id} để hủy.")
            return

        so_id = so_search[0]
        update_data = {'x_web_status': 'CANCELLED'}
        if order.note:
            odoo.execute('sale.order', 'write', [so_id], {'x_web_note': order.note})
            logger.info(f"Đã cập nhật lý do hủy vào x_web_note cho SO {so_id}")
        so_data = odoo.execute('sale.order', 'read', [so_id], ['state', 'picking_ids'])[0]

        if so_data['state'] == 'cancel':
            return f"SO {so_id} đã được hủy từ trước."

        if so_data.get('picking_ids'):
            pickings = odoo.execute('stock.picking', 'read', so_data['picking_ids'], ['state'])
            for picking in pickings:
                if picking['state'] == 'done':
                    try:
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
                            logger.info(f"Bỏ qua Picking {picking['id']} vì không có số lượng thực xuất.")
                            continue

                        return_wizard_id = odoo.execute('stock.return.picking', 'create', {
                            'picking_id': picking['id'],
                            'product_return_moves': return_moves
                        })
                        
                        return_res = odoo.execute('stock.return.picking', 'create_returns', [return_wizard_id])
                        new_picking_id = return_res.get('res_id')
                        
                        if new_picking_id:
                            logger.info(f"Đã tạo Phiếu Trả Hàng ID {new_picking_id}. Đang tiến hành tự động Xác nhận...")
                            
                            odoo.execute('stock.picking', 'action_assign', [new_picking_id])
                            
                            new_moves = odoo.execute('stock.move', 'search', [('picking_id', '=', new_picking_id)])
                            for move_id in new_moves:
                                move_data = odoo.execute('stock.move', 'read', [move_id], ['product_uom_qty'])[0]
                                odoo.execute('stock.move', 'write', [move_id], {'quantity_done': move_data['product_uom_qty']})
                                
                            odoo.execute('stock.picking', 'button_validate', [new_picking_id])
                            logger.info(f"✅ Đã HOÀN TỒN KHO thành công cho Phiếu Trả Hàng {new_picking_id}")
                            
                    except Exception as e:
                        logger.error(f"Lỗi khi xử lý trả hàng cho Picking {picking['id']}: {e}")
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

        return f"Cancel Order {order_id} in Odoo success!"

    except Exception as exc:
        logger.error(f"Lỗi khi cancel Order ID {order_id} trên Odoo: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=3)
def update_order_status_in_odoo_task(self, order_id, new_status):
    try:
        Order = apps.get_model('orders', 'Order')
        order = Order.objects.get(id=order_id)
        
        so_search = odoo.execute('sale.order', 'search', [('x_django_id', '=', order.id)])
        if so_search:
            so_id = so_search[0]
            odoo.execute('sale.order', 'write', [so_id], {'x_web_status': new_status})
            logger.info(f"Đã cập nhật trạng thái {new_status} cho SO {so_id} do KHÁCH HÀNG BẤM TRÊN WEB.")
    except Exception as exc:
        logger.error(f"Lỗi đẩy trạng thái xác nhận sang Odoo: {exc}")
        raise self.retry(exc=exc, countdown=60)