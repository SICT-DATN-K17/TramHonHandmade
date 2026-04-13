from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product
from .tasks import sync_product_to_odoo_task
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Product)
def trigger_sync_product(sender, instance, created, **kwargs):
    if getattr(instance, '_is_from_webhook', False):
        return

    logger.info(f"Triggering sync to Odoo for Product ID: {instance.id}")
    sync_product_to_odoo_task.delay(instance.id)