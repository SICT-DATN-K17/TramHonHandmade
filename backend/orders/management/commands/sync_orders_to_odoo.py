from django.core.management.base import BaseCommand
from orders.models import Order
from orders.tasks import sync_order_to_odoo_task
from services.odoo_client import odoo
import time

class Command(BaseCommand):
    help = 'Đồng bộ toàn bộ Đơn hàng và Trạng thái (x_web_status) từ Django sang Odoo'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('=== BẮT ĐẦU KIỂM TRA VÀ ĐỒNG BỘ ĐƠN HÀNG SANG ODOO ==='))

        orders = Order.objects.all().order_by('id')
        total = orders.count()
        self.stdout.write(f"Tìm thấy tổng cộng {total} đơn hàng trong Database Web.")

        synced_count = 0
        updated_status_count = 0
        skipped_count = 0
        fail_count = 0

        self.stdout.write(self.style.WARNING('Đang kéo dữ liệu đệm (Cache) Sale Orders từ Odoo về...'))
        odoo_orders = odoo.execute('sale.order', 'search_read', [('x_django_id', '!=', False)], ['id', 'x_django_id', 'x_web_status'])
        
        odoo_order_cache = {
            order['x_django_id']: {
                'id': order['id'], 
                'x_web_status': order.get('x_web_status')
            } 
            for order in odoo_orders if order.get('x_django_id')
        }
        
        self.stdout.write(self.style.WARNING(f"Đã lấy được {len(odoo_order_cache)} đơn hàng đang có trên Odoo!"))

        for order in orders:
            try:
                if order.id in odoo_order_cache:
                    odoo_data = odoo_order_cache[order.id]
                    
                    if odoo_data['x_web_status'] != order.status:
                        self.stdout.write(f"[CẬP NHẬT] Order ID {order.id}: {odoo_data['x_web_status']} ---> {order.status}")
                        odoo.execute('sale.order', 'write', [odoo_data['id']], {'x_web_status': order.status})
                        updated_status_count += 1
                    else:
                        self.stdout.write(f"[BỎ QUA] Order ID {order.id} đã đồng bộ chuẩn (Status: {order.status}).")
                        skipped_count += 1
                    continue
                
                self.stdout.write(f"[ĐANG ĐẨY] Tống Order ID {order.id} vào hàng đợi Celery để tạo SO mới...")
                sync_order_to_odoo_task.delay(order.id)
                synced_count += 1
                
                time.sleep(0.1)
                
            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"[LỖI] Không thể xử lý Order ID {order.id}. Chi tiết: {e}"))

        self.stdout.write(self.style.SUCCESS('\n====================================================='))
        self.stdout.write(self.style.SUCCESS('HOÀN TẤT TỔNG KIỂM TRA & ĐỒNG BỘ!'))
        self.stdout.write(self.style.SUCCESS(f'Đã đẩy vào Celery tạo mới: {synced_count} đơn hàng.'))
        self.stdout.write(self.style.SUCCESS(f'Đã cập nhật trạng thái (x_web_status): {updated_status_count} đơn hàng.'))
        self.stdout.write(self.style.WARNING(f'Bỏ qua: {skipped_count} đơn hàng (Đã chuẩn 100%).'))
        if fail_count > 0:
            self.stdout.write(self.style.ERROR(f'Lỗi: {fail_count} đơn hàng.'))
        self.stdout.write(self.style.WARNING("Lưu ý: Hãy đảm bảo Celery Worker đang chạy nếu có task tạo mới nhé!"))