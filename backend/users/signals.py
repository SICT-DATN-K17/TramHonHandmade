from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Address
from .tasks import sync_user_to_odoo_task

User = get_user_model()

@receiver(pre_save, sender=User)
def capture_old_user_data(sender, instance, **kwargs):
    if instance.pk:  
        try:
            old_instance = User.objects.get(pk=instance.pk)
            instance._old_data = {
                'name': old_instance.name,
                'role': old_instance.role,
                'bio': old_instance.bio,
            }
        except User.DoesNotExist:
            pass

@receiver(pre_save, sender=Address)
def capture_old_address_data(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Address.objects.get(pk=instance.pk)
            instance._old_data = {
                'phone_number': old_instance.phone_number,
                'detail_address': old_instance.detail_address,
            }
        except Address.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def trigger_sync_user(sender, instance, created, **kwargs):
    if instance.is_active:
        old_data = getattr(instance, '_old_data', None)
        sync_user_to_odoo_task.delay(instance.id, old_user_data=old_data)

@receiver(post_save, sender=Address)
def trigger_sync_address(sender, instance, created, **kwargs):
    if instance.user.is_active:
        old_data = getattr(instance, '_old_data', None)
        sync_user_to_odoo_task.delay(instance.user.id, old_address_data=old_data)