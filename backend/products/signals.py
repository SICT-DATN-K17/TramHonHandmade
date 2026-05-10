from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Product
from .tasks import sync_product_to_odoo_task
from orders.services import initialize_stock_in_redis
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Product)
def capture_old_product_data(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Product.objects.get(pk=instance.pk)
            instance._old_data = {
                'name': old_instance.name,
                'price': old_instance.price,
                'description': old_instance.description,
                'status': old_instance.status,
                'category_id': old_instance.category_id,
                'stock_quantity': old_instance.stock_quantity,
                'image': old_instance.image,
            }
        except Product.DoesNotExist:
            pass

@receiver(post_save, sender=Product)
def trigger_sync_product(sender, instance, created, **kwargs):
    try:
        initialize_stock_in_redis(instance.id, instance.stock_quantity)
        logger.info(f"Redis Cache: Đã đồng bộ tồn kho ({instance.stock_quantity}) cho Product ID: {instance.id}")
    except Exception as e:
        logger.error(f"Redis Cache Error: Lỗi cập nhật cho Product ID {instance.id}: {e}")

    if getattr(instance, '_is_from_webhook', False):
        return

    old_data = getattr(instance, '_old_data', None)
    logger.info(f"Triggering sync to Odoo for Product ID: {instance.id}")
    sync_product_to_odoo_task.delay(instance.id, old_product_data=old_data)