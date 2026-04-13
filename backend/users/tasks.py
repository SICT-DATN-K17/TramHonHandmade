from celery import shared_task
from django.contrib.auth import get_user_model
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=3)
def sync_user_to_odoo_task(self, user_id):
    try:
        user = User.objects.get(id=user_id)
        if not user.is_active:
            return f"Skipped: User {user.email} is not active"
            
        if user.role == 'ADMIN' or user.is_superuser:
            logger.info(f"Bỏ qua sync user {user.email} vì là ADMIN.")
            return f"Skipped: User {user.email} is Admin"

        payload = {
            'name': user.name, 
            'email': user.email,
            'x_django_id': user.id,
            'x_role': user.role, 
            'active': user.is_active,
            'x_bio': user.bio if user.bio else False,
        }

        existing_partner = odoo.execute('res.partner', 'search', [('x_django_id', '=', user.id)])

        if existing_partner:
            odoo.execute('res.partner', 'write', existing_partner, payload)
            logger.info(f"Đã UPDATE user {user.email} trên Odoo (ID: {existing_partner[0]})")
        else:
            new_id = odoo.execute('res.partner', 'create', payload)
            logger.info(f"Đã TẠO MỚI user {user.email} trên Odoo (ID: {new_id})")

        return f"Sync success: {user.email}"

    except Exception as exc:
        logger.error(f"Lỗi sync user ID {user_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)