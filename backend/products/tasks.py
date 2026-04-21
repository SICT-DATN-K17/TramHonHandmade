from celery import shared_task
from django.apps import apps
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def sync_product_to_odoo_task(self, product_id):
    try:
        Product = apps.get_model('products', 'Product')
        try:
            prod = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            logger.info(f"Sản phẩm {product_id} không tồn tại, bỏ qua sync.")
            return

        odoo_cat_id = None
        odoo_artisan_id = None

        if prod.category:
            cat_search = odoo.execute('product.category', 'search', [('x_django_id', '=', prod.category.id)])
            if cat_search: odoo_cat_id = cat_search[0]

        if prod.artisan:
            art_search = odoo.execute('res.partner', 'search', [('x_django_id', '=', prod.artisan.id)])
            if art_search: odoo_artisan_id = art_search[0]

        payload = {
            'name': prod.name,
            'list_price': float(prod.price),
            'description_sale': prod.description or '',
            'categ_id': odoo_cat_id,
            'x_artisan_id': odoo_artisan_id,
            'x_django_id': prod.id,
            'x_image_url': prod.image or '',
            'active': True, 
            'x_web_status': prod.status, 
            'detailed_type': 'product', 
        }

        existing_template = odoo.execute('product.template', 'search', [('x_django_id', '=', prod.id)])
        
        if existing_template:
            odoo.execute('product.template', 'write', existing_template, payload)
            template_id = existing_template[0]
            action = "UPDATE"
        else:
            template_id = odoo.execute('product.template', 'create', payload)
            action = "TẠO MỚI"

        logger.info(f"Đã {action} vỏ sản phẩm '{prod.name}' trên Odoo (Template ID: {template_id})")

        if action == "TẠO MỚI":
            locations = odoo.execute('stock.location', 'search', [('usage', '=', 'internal')], limit=1)
            if locations:
                default_location_id = locations[0]
                
                product_variant = odoo.execute('product.product', 'search', [('product_tmpl_id', '=', template_id)])
                if product_variant:
                    odoo_product_id = product_variant[0]
                    stock_qty = prod.stock_quantity

                    existing_quants = odoo.execute('stock.quant', 'search', [
                        ('product_id', '=', odoo_product_id),
                        ('location_id', '=', default_location_id)
                    ])

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

                    try:
                        odoo.execute('stock.quant', 'action_apply_inventory_safe', [quant_id])
                    except Exception as e:
                        logger.warning(f"Đã áp dụng kho cho {prod.name} nhưng lỗi XML-RPC: {e}")

        return f"Sync success: {prod.name}"

    except Exception as exc:
        logger.error(f"Lỗi sync Product ID {product_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)

@shared_task(bind=True, max_retries=3)
def archive_product_in_odoo_task(self, product_id):
    try:
        existing_template = odoo.execute('product.template', 'search', [('x_django_id', '=', product_id)])
        
        if existing_template:
            odoo.execute('product.template', 'write', existing_template, {'x_web_status': 'HIDDEN'})
            logger.info(f"Đã ẨN (Hidden) sản phẩm có Django ID {product_id} trên Odoo.")
        else:
            logger.warning(f"Không tìm thấy sản phẩm Django ID {product_id} trên Odoo để Ẩn.")

        return f"Archive success: {product_id}"

    except Exception as exc:
        logger.error(f"Lỗi Archive Product ID {product_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)