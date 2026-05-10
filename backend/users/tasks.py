from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.contrib.auth import get_user_model
from django.apps import apps
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=10, default_retry_delay=15)
def sync_user_to_odoo_task(self, user_id, old_user_data=None, old_address_data=None):
    try:
        user = User.objects.get(id=user_id)
        if not user.is_active:
            return f"Skipped: User {user.email} is not active"
            
        if user.role == 'ADMIN' or user.is_superuser:
            return f"Skipped: User {user.email} is Admin"

        payload = {
            'name': user.name, 
            'email': user.email,
            'x_django_id': user.id,
            'x_role': user.role, 
            'active': user.is_active,
            'x_bio': user.bio if user.bio else False,
        }
        try:
            addr = user.address
            payload['phone'] = addr.phone_number
            payload['street'] = addr.detail_address
        except Exception:
            pass

        existing_partner = odoo.execute('res.partner', 'search', [('x_django_id', '=', user.id)])

        if existing_partner:
            odoo.execute('res.partner', 'write', existing_partner, payload)
            logger.info(f"Đã UPDATE user {user.email} trên Odoo (ID: {existing_partner[0]})")
        else:
            new_id = odoo.execute('res.partner', 'create', payload)
            logger.info(f"Đã TẠO MỚI user {user.email} trên Odoo (ID: {new_id})")

        return f"Sync success: {user.email}"

    except Exception as exc:
        # KIỂM TRA CHỦ ĐỘNG: Đã thử quá số lần cho phép chưa?
        if self.request.retries >= self.max_retries:
            logger.error(f"[CRITICAL] Odoo sập! Kích hoạt ROLLBACK cho User ID {user_id}")
            
            if old_user_data:
                User.objects.filter(id=user_id).update(**old_user_data)
                logger.info(f"-> Đã Rollback User {user_id} về trạng thái cũ: {old_user_data}")
            
            if old_address_data:
                Address = apps.get_model('users', 'Address')
                Address.objects.filter(user_id=user_id).update(**old_address_data)
                logger.info(f"-> Đã Rollback Address của User {user_id} về trạng thái cũ: {old_address_data}")
                
            return f"Sync failed permanently. User {user_id} rolled back to old data."
            
        else:
            # CHƯA QUÁ SỐ LẦN -> TIẾP TỤC ĐƯA VÀO HÀNG ĐỢI
            logger.warning(f"Lỗi sync User {user_id} lên Odoo: {exc}. Celery sẽ thử lại sau 15s...")
            raise self.retry(exc=exc, countdown=15)