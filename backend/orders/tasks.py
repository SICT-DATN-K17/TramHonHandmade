from celery import shared_task
from services.odoo_client import odoo
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def confirm_and_send_mail_odoo_task(self, so_id):
    try:
        odoo.execute('sale.order', 'action_confirm', [so_id])
        logger.info(f"Đã chốt đơn SO_ID = {so_id}")

        template_records = odoo.execute('mail.template', 'search', [('id', '=', 12)])
        if template_records:
            odoo.execute('mail.template', 'send_mail', [template_records[0]], so_id, True)
            logger.info(f"Đã gửi email thành công cho SO_ID = {so_id}")
            
        return f"Hoàn tất chốt đơn và gửi mail cho SO {so_id}"

    except Exception as exc:
        logger.error(f"Lỗi khi chốt đơn/gửi mail SO_ID {so_id}: {exc}")
        raise self.retry(exc=exc)