from django.core.management.base import BaseCommand
from products.models import Category  # Nhớ check lại đường dẫn import
from services.odoo_client import odoo

class Command(BaseCommand):
    help = 'Đồng bộ Danh mục sản phẩm (Category) từ Django sang Odoo (Cấu trúc phẳng)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Bắt đầu đồng bộ Categories sang Odoo...'))

        categories = Category.objects.all()
        success_count = 0
        fail_count = 0

        for cat in categories:
            try:
                # Thay dòng cũ bằng dòng này:
                existing_odoo_cat = odoo.execute('product.category', 'search', [('x_django_id', '=', cat.id)])

                payload = {
                    'name': cat.name,
                    'x_django_id': cat.id,
                    'x_slug': cat.slug,
                    'x_web_status': 'ACTIVE' if cat.status == 'ACTIVE' else 'HIDDEN',
                }

                if existing_odoo_cat:
                    odoo.execute('product.category', 'write', existing_odoo_cat, payload)
                    self.stdout.write(f"Đã UPDATE: {cat.name} (Odoo ID: {existing_odoo_cat[0]})")
                else:
                    new_id = odoo.execute('product.category', 'create', payload)
                    self.stdout.write(self.style.SUCCESS(f"Đã TẠO MỚI: {cat.name} (Odoo ID: {new_id})"))
                
                success_count += 1

            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"LỖI danh mục {cat.name}: {e}"))

        self.stdout.write(self.style.SUCCESS(f'\n--- HOÀN TẤT ---'))
        self.stdout.write(f'Thành công: {success_count} | Thất bại: {fail_count}')