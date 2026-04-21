from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product
from .tasks import sync_product_to_odoo_task
from orders.services import initialize_stock_in_redis # Import hàm Redis từ app orders
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Product)
def trigger_sync_product(sender, instance, created, **kwargs):
    try:
        initialize_stock_in_redis(instance.id, instance.stock_quantity)
        logger.info(f"Redis Cache: Đã đồng bộ tồn kho ({instance.stock_quantity}) cho Product ID: {instance.id}")
    except Exception as e:
        logger.error(f"Redis Cache Error: Lỗi cập nhật cho Product ID {instance.id}: {e}")

    if getattr(instance, '_is_from_webhook', False):
        return

    logger.info(f"Triggering sync to Odoo for Product ID: {instance.id}")
    sync_product_to_odoo_task.delay(instance.id)