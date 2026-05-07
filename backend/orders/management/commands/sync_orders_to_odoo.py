from django.core.management.base import BaseCommand
from orders.models import Order
from orders.tasks import sync_order_to_odoo_task
from services.odoo_client import odoo
import time

class Command(BaseCommand):
    help = 'Đồng bộ Đơn hàng cũ, ép khớp Giao hàng và Hóa đơn theo trạng thái Web'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('=== BẮT ĐẦU ĐỒNG BỘ ĐƠN HÀNG VÀ ÉP TRẠNG THÁI ODOO ==='))

        orders = Order.objects.all().order_by('id')
        self.stdout.write(f"Tìm thấy {orders.count()} đơn hàng trên Web.")

        odoo_orders = odoo.execute(
            'sale.order', 'search_read', 
            [('x_django_id', '!=', False)], 
            ['id', 'x_django_id', 'x_web_status', 'state', 'picking_ids', 'invoice_ids']
        )
        odoo_cache = {o['x_django_id']: o for o in odoo_orders if o.get('x_django_id')}

        for order in orders:
            if order.id not in odoo_cache:
                self.stdout.write(f"[ĐẨY MỚI] Gửi Order ID {order.id} cho Celery tạo SO...")
                sync_order_to_odoo_task.delay(order.id)
                time.sleep(0.1)
                continue

            odoo_data = odoo_cache[order.id]
            so_id = odoo_data['id']
            
            # 1. Cập nhật trạng thái hiển thị
            if odoo_data['x_web_status'] != order.status and order.status != 'CANCELLED':
                odoo.execute('sale.order', 'write', [so_id], {'x_web_status': order.status})
                self.stdout.write(f"\n[CẬP NHẬT] Order {order.id} -> Trạng thái: {order.status}")

            # 2. ÉP TIẾN ĐỘ THỰC TẾ TRÊN ODOO
            try:
                # Nếu SO vẫn nháp mà Web đã tiến triển -> Confirm để sinh phiếu kho
                if odoo_data['state'] in ['draft', 'sent'] and order.status not in ['PENDING_PICKUP', 'CANCELLED']:
                    odoo.execute('sale.order', 'action_confirm', [so_id])
                    self.stdout.write(f"  -> Đã Confirm SO {so_id} để sinh Phiếu Xuất Kho.")
                    odoo_data = odoo.execute('sale.order', 'read', [so_id], ['picking_ids', 'invoice_ids'])[0]

                # --- XỬ LÝ PHIẾU XUẤT KHO ---
                if order.status in ['SHIPPING', 'DELIVERED_AWAITING', 'DELIVERED', 'COMPLETED']:
                    picking_ids = odoo_data.get('picking_ids', [])
                    if picking_ids:
                        pickings = odoo.execute('stock.picking', 'read', picking_ids, ['state'])
                        for pick in pickings:
                            if pick['state'] not in ['done', 'cancel']:
                                odoo.execute('stock.picking', 'action_assign', [pick['id']])
                                moves = odoo.execute('stock.move', 'search', [('picking_id', '=', pick['id'])])
                                for move_id in moves:
                                    qty = odoo.execute('stock.move', 'read', [move_id], ['product_uom_qty'])[0]['product_uom_qty']
                                    odoo.execute('stock.move', 'write', [move_id], {'quantity_done': qty})
                                
                                odoo.execute('stock.picking', 'button_validate', [pick['id']])
                                self.stdout.write(f"  -> Đã XUẤT KHO THÀNH CÔNG cho SO {so_id}.")

                # --- XỬ LÝ HÓA ĐƠN THEO ĐÚNG Ý SẾP ---
                if order.status in ['DELIVERED', 'COMPLETED']:
                    invoice_ids = odoo_data.get('invoice_ids', [])
                    
                    # Bước A: Nếu chưa có hóa đơn thì CHỈ tạo nháp (Draft)
                    if not invoice_ids:
                        odoo.execute('sale.order', '_create_invoices', [so_id])
                        invoice_ids = odoo.execute('sale.order', 'read', [so_id], ['invoice_ids'])[0]['invoice_ids']
                        self.stdout.write(f"  -> Đã TẠO HÓA ĐƠN NHÁP cho SO {so_id} (Chờ kế toán review).")

                    # Bước B: CHỈ KHI đơn là COMPLETED thì mới ép chốt hóa đơn (Posted)
                    if order.status == 'COMPLETED' and invoice_ids:
                        invoices = odoo.execute('account.move', 'read', invoice_ids, ['state'])
                        for inv in invoices:
                            if inv['state'] == 'draft':
                                odoo.execute('account.move', 'action_post', [inv['id']])
                                self.stdout.write(f"  -> Đã CHỐT HÓA ĐƠN (Posted) cho SO {so_id} do đơn đã Hoàn thành.")

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  -> [LỖI] Cấn logic kho/hóa đơn tại Order {order.id}: {e}"))

        self.stdout.write(self.style.SUCCESS('\n=== CHỐT SỔ ĐỒNG BỘ ĐƠN HÀNG! ==='))