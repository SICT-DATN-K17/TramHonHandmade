from celery import shared_task
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def confirm_and_send_mail_odoo_task(self, so_id):
    try:
        odoo.execute('sale.order', 'action_confirm', [so_id])
        logger.info(f"Đã chốt đơn SO_ID = {so_id}")

        template_records = odoo.execute('mail.template', 'search', [('id', '=', 12)])
        if template_records:
            odoo.execute('mail.template', 'send_mail', [template_records[0]], so_id, True)
            logger.info(f"Đã gửi email thành công cho SO_ID = {so_id}")
            
        return f"Hoàn tất chốt đơn và gửi mail cho SO {so_id}"

    except Exception as exc:
        logger.error(f"Lỗi khi chốt đơn/gửi mail SO_ID {so_id}: {exc}")
        raise self.retry(exc=exc)

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def process_heavy_cancel_in_odoo_task(self, so_id):
    try:
        so_data = odoo.execute('sale.order', 'read', [so_id], ['state', 'picking_ids'])[0]

        if so_data['state'] == 'cancel':
            return f"Đơn SO {so_id} đã hủy từ trước"

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

                    if return_moves:
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
            logger.info(f"Đã HỦY SO {so_id} và TỰ ĐỘNG GỬI EMAIL cho khách.")
        except Exception as e:
            logger.warning(f"Không thể dùng wizard gửi mail, fallback về lệnh cancel gốc: {e}")
            odoo.execute('sale.order', 'action_cancel', [so_id])
            
        return f"Hoàn tất dọn dẹp và gửi mail hủy cho SO {so_id}"

    except Exception as exc:
        logger.error(f"Lỗi khi Celery dọn dẹp SO {so_id}: {exc}")
        raise self.retry(exc=exc)