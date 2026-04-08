from django.core.management.base import BaseCommand
from users.models import CustomUser  # Nhớ check lại tên model của ông
from services.odoo_client import odoo

class Command(BaseCommand):
    help = 'Đồng bộ toàn bộ User (Khách hàng & Nghệ nhân) từ Django sang Odoo'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Bắt đầu đồng bộ Users sang Odoo...'))

        users = CustomUser.objects.filter(is_active=True, role__in=['CUSTOMER', 'ARTISAN'])
        success_count = 0
        fail_count = 0

        for user in users:
            try:
                existing_odoo_id = odoo.execute('res.partner', 'search', [('x_django_id', '=', user.id)])

                payload = {
                    'name': user.name if user.name else user.username, 
                    'email': user.email,
                    'x_django_id': user.id,
                    'x_role': user.role,  
                    'x_bio': user.bio if hasattr(user, 'bio') and user.bio else '',
                }

                if existing_odoo_id:
                    odoo.execute('res.partner', 'write', existing_odoo_id, payload)
                    self.stdout.write(f"Đã UPDATE: {payload['name']} (Odoo ID: {existing_odoo_id[0]})")
                else:
                    new_id = odoo.execute('res.partner', 'create', payload)
                    self.stdout.write(self.style.SUCCESS(f"Đã TẠO MỚI: {payload['name']} (Odoo ID: {new_id})"))
                
                success_count += 1

            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"LỖI user {user.username}: {e}"))

        self.stdout.write(self.style.SUCCESS(f'\n--- HOÀN TẤT ---'))
        self.stdout.write(f'Thành công: {success_count} | Thất bại: {fail_count}')