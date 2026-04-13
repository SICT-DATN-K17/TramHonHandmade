from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .tasks import sync_user_to_odoo_task

User = get_user_model()

@receiver(post_save, sender=User)
def trigger_sync_user(sender, instance, created, **kwargs):
    if instance.is_active:
        sync_user_to_odoo_task.delay(instance.id)