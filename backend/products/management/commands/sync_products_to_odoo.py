from django.core.management.base import BaseCommand
from products.models import Product 
from services.odoo_client import odoo

class Command(BaseCommand):
    help = 'Đồng bộ Sản phẩm sang Odoo (Phiên bản tối ưu tốc độ bằng Caching)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Đang kéo dữ liệu đệm (Cache) từ Odoo về...'))

        odoo_cats = odoo.execute('product.category', 'search_read', [], ['id', 'x_django_id'])
        cat_cache = {cat['x_django_id']: cat['id'] for cat in odoo_cats if cat.get('x_django_id')}

        odoo_artisans = odoo.execute('res.partner', 'search_read', [('x_role', '=', 'ARTISAN')], ['id', 'x_django_id'])
        artisan_cache = {art['x_django_id']: art['id'] for art in odoo_artisans if art.get('x_django_id')}

        self.stdout.write(self.style.WARNING('Đã tải Cache xong! Bắt đầu đồng bộ 1000+ Products...'))

        products = Product.objects.all()
        success_count = 0
        fail_count = 0

        for prod in products:
            try:
                odoo_cat_id = cat_cache.get(prod.category.id) if prod.category else None
                odoo_artisan_id = artisan_cache.get(prod.artisan.id) if prod.artisan else None

                payload = {
                    'name': prod.name,
                    'list_price': float(prod.price),
                    'description_sale': prod.description or '',
                    'categ_id': odoo_cat_id,
                    'x_artisan_id': odoo_artisan_id,
                    'x_django_id': prod.id,
                    'x_image_url': prod.image or '',
                    'active': True,
                    'x_web_status': 'ACTIVE' if prod.status == 'ACTIVE' else 'HIDDEN',
                    'detailed_type': 'product', 
                }

                existing_odoo_prod = odoo.execute('product.template', 'search', [('x_django_id', '=', prod.id)])

                if existing_odoo_prod:
                    odoo.execute('product.template', 'write', existing_odoo_prod, payload)
                    self.stdout.write(f"Đã UPDATE: {prod.name}")
                else:
                    new_id = odoo.execute('product.template', 'create', payload)
                    self.stdout.write(self.style.SUCCESS(f"Đã TẠO MỚI: {prod.name} (ID: {new_id})"))
                
                success_count += 1

            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"LỖI sản phẩm {prod.name}: {e}"))

        self.stdout.write(self.style.SUCCESS(f'\n--- HOÀN TẤT ---'))
        self.stdout.write(f'Thành công: {success_count} | Thất bại: {fail_count}')