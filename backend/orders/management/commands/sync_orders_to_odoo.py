from django.core.management.base import BaseCommand
from django.db.models import Prefetch
from orders.models import Order
from orders.tasks import sync_order_to_odoo_task
from services.odoo_client import odoo
import time

class Command(BaseCommand):
    help = 'Đồng bộ toàn bộ Đơn hàng cũ từ Django sang Odoo (Bỏ qua các đơn đã tồn tại)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('=== BẮT ĐẦU KIỂM TRA VÀ ĐỒNG BỘ ĐƠN HÀNG SANG ODOO ==='))

        # Lấy tất cả các order hiện có
        orders = Order.objects.all().order_by('id')
        total = orders.count()
        self.stdout.write(f"Tìm thấy tổng cộng {total} đơn hàng trong Database.")

        synced_count = 0
        skipped_count = 0
        fail_count = 0

        # Lấy Cache danh sách các Order đã có bên Odoo (Để tối ưu tốc độ, đỡ phải query từng cái một)
        self.stdout.write(self.style.WARNING('Đang kéo dữ liệu đệm (Cache) Sale Orders từ Odoo về...'))
        odoo_orders = odoo.execute('sale.order', 'search_read', [('x_django_id', '!=', False)], ['id', 'x_django_id'])
        odoo_order_cache = {order['x_django_id']: order['id'] for order in odoo_orders if order.get('x_django_id')}
        
        self.stdout.write(self.style.WARNING(f'Đã lấy được {len(odoo_order_cache)} đơn hàng đang có trên Odoo!'))

        for order in orders:
            try:
                # Kiểm tra xem đơn đã có bên Odoo chưa bằng Cache (Tốc độ ánh sáng)
                if order.id in odoo_order_cache:
                    self.stdout.write(f"[BỎ QUA] Order ID {order.id} đã tồn tại trên Odoo (Odoo SO_ID: {odoo_order_cache[order.id]}).")
                    skipped_count += 1
                    continue
                
                # Ném vào Celery xử lý
                self.stdout.write(f"[ĐANG ĐẨY] Tống Order ID {order.id} vào hàng đợi Celery...")
                sync_order_to_odoo_task.delay(order.id)
                synced_count += 1
                
                # Nghỉ ngơi 0.1s để tránh quá tải Message Broker
                time.sleep(0.1)
                
            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"[LỖI] Không thể xử lý Order ID {order.id}. Chi tiết: {e}"))

        self.stdout.write(self.style.SUCCESS('\n====================================================='))
        self.stdout.write(self.style.SUCCESS(f'🚀 HOÀN TẤT TỔNG KIỂM TRA!'))
        self.stdout.write(self.style.SUCCESS(f'✅ Đã đẩy vào Celery: {synced_count} đơn hàng.'))
        self.stdout.write(self.style.WARNING(f'⏭️ Bỏ qua: {skipped_count} đơn hàng (đã tồn tại).'))
        if fail_count > 0:
            self.stdout.write(self.style.ERROR(f'❌ Lỗi: {fail_count} đơn hàng.'))
        self.stdout.write(self.style.WARNING("💡 Lưu ý: Hãy đảm bảo bạn đang bật Celery Worker (celery -A backend worker -l info) để nó 'nhai' đống task này nhé!"))