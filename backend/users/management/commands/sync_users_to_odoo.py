from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Address
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = 'Đồng bộ toàn bộ Khách hàng và Nghệ nhân sang Odoo ERP'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('--- Bắt đầu đồng bộ Users sang Odoo ---'))

        # Lấy tất cả user là khách hàng hoặc nghệ nhân đã kích hoạt
        users = User.objects.filter(is_active=True, role__in=['CUSTOMER', 'ARTISAN'])
        total = users.count()
        success = 0
        error = 0

        for index, user in enumerate(users, 1):
            try:
                # 1. Chuẩn bị dữ liệu cơ bản
                payload = {
                    'name': user.name,
                    'email': user.email,
                    'x_django_id': user.id,
                    'x_role': user.role,
                    'x_bio': user.bio if user.bio else False,
                    'active': True,
                }

                # 2. Lấy thông tin địa chỉ/SĐT nếu có
                try:
                    addr = Address.objects.get(user=user)
                    payload['phone'] = addr.phone_number
                    payload['street'] = addr.detail_address
                except Address.DoesNotExist:
                    pass

                # 3. Kiểm tra xem đã tồn tại trên Odoo chưa
                existing_partner = odoo.execute('res.partner', 'search', [('x_django_id', '=', user.id)])

                if existing_partner:
                    # Cập nhật
                    odoo.execute('res.partner', 'write', existing_partner, payload)
                    status_msg = f"[{index}/{total}] Cập nhật: {user.email}"
                else:
                    # Tạo mới
                    new_id = odoo.execute('res.partner', 'create', payload)
                    status_msg = f"[{index}/{total}] Tạo mới: {user.email} (ID: {new_id})"

                self.stdout.write(self.style.SUCCESS(status_msg))
                success += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[{index}/{total}] Lỗi user {user.email}: {str(e)}"))
                error += 1

        self.stdout.write(self.style.SUCCESS(f'\n--- Hoàn thành: Thành công {success}, Lỗi {error} ---'))