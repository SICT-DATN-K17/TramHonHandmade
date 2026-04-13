from django.core.management.base import BaseCommand
from products.models import Product
from services.odoo_client import odoo

class Command(BaseCommand):
    help = 'Đồng bộ Tồn kho (Stock) từ Django sang Odoo (Dùng Kiểm kê - Inventory Adjustment)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Bước 1: Tìm vị trí kho chính (WH/Stock)...'))
        
        locations = odoo.execute('stock.location', 'search', [('usage', '=', 'internal')], limit=1)
        if not locations:
            self.stdout.write(self.style.ERROR('Không tìm thấy vị trí kho nội bộ nào trong Odoo!'))
            return
            
        default_location_id = locations[0]
        self.stdout.write(f'Đã chốt Location ID: {default_location_id}')

        self.stdout.write(self.style.WARNING('\nBước 2: Kéo bộ nhớ đệm (Cache) Product Variants từ Odoo...'))
        
        odoo_products = odoo.execute('product.product', 'search_read', [('x_django_id', '!=', False)], ['id', 'x_django_id'])
        product_cache = {p['x_django_id']: p['id'] for p in odoo_products}

        self.stdout.write(self.style.WARNING(f'Đã tải xong {len(product_cache)} sản phẩm. Bắt đầu đẩy tồn kho...\n'))

        django_products = Product.objects.all()
        success_count = 0
        fail_count = 0

        for prod in django_products:
            try:
                odoo_product_id = product_cache.get(prod.id)
                if not odoo_product_id:
                    self.stdout.write(self.style.ERROR(f"Bỏ qua {prod.name}: Chưa đồng bộ vỏ sản phẩm sang Odoo."))
                    fail_count += 1
                    continue

                stock_qty = prod.stock_quantity

                existing_quants = odoo.execute('stock.quant', 'search', [
                    ('product_id', '=', odoo_product_id),
                    ('location_id', '=', default_location_id)
                ])

                quant_id = None
                if existing_quants:
                    quant_id = existing_quants[0]
                    odoo.execute('stock.quant', 'write', [quant_id], {'inventory_quantity': stock_qty})
                else:
                    new_quant = odoo.execute('stock.quant', 'create', {
                        'product_id': odoo_product_id,
                        'location_id': default_location_id,
                        'inventory_quantity': stock_qty
                    })
                    quant_id = new_quant[0] if isinstance(new_quant, list) else new_quant

                odoo.execute('stock.quant', 'action_apply_inventory_safe', [quant_id])

                self.stdout.write(f"✅ Đã cập nhật TỒN KHO: {prod.name} -> {stock_qty} sản phẩm")
                success_count += 1

            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"❌ LỖI kho {prod.name}: {e}"))

        self.stdout.write(self.style.SUCCESS(f'\n--- HOÀN TẤT ĐỒNG BỘ TỒN KHO ---'))
        self.stdout.write(f'Thành công: {success_count} | Thất bại: {fail_count}')