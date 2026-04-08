from celery import shared_task
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)

@shared_task
def sync_product_to_odoo_task(product_id, name, price, description):
    """Task chạy ngầm đẩy sản phẩm sang Odoo"""
    try:
        payload = {
            'name': name,
            'list_price': float(price),
            'description_sale': description,
            # 'x_django_id': product_id  # Khi nào custom model Odoo xong thì mở comment dòng này
        }
        
        # Test gọi XML-RPC tạo sản phẩm
        new_odoo_id = odoo.execute('product.template', 'create', payload)
        
        if new_odoo_id:
            logger.info(f"✅ [CELERY] Đã đẩy sản phẩm '{name}' sang Odoo. ID mới: {new_odoo_id}")
            return new_odoo_id
        else:
            logger.warning(f"⚠️ [CELERY] Odoo không trả về ID cho sản phẩm '{name}'")
            return None
            
    except Exception as e:
        logger.error(f"❌ [CELERY] Lỗi khi đẩy sản phẩm sang Odoo: {e}")
        raise