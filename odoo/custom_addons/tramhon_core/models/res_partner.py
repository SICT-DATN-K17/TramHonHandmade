from odoo import models, fields, api
from odoo.exceptions import UserError
import requests
import os
import logging

_logger = logging.getLogger(__name__)

class ResPartner(models.Model):
    _inherit = 'res.partner'

    x_django_id = fields.Integer(string='Django User ID', index=True, copy=False)
    x_role = fields.Selection([
        ('CUSTOMER', 'Khách hàng'),
        ('ARTISAN', 'Nghệ nhân')
    ], string='Vai trò', default='CUSTOMER', index=True)
    x_bio = fields.Text(string='Giới thiệu/Tiểu sử')

    def write(self, vals):
        res = super(ResPartner, self).write(vals)
        
        sync_fields = ['name', 'x_role', 'x_bio', 'phone', 'street']
        if any(key in vals for key in sync_fields):
            for record in self:
                if record.x_django_id:
                    self._send_webhook_to_django(record)
        return res

    def _send_webhook_to_django(self, record):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')
        if not django_url or not secret_token:
            _logger.warning("Chưa cấu hình DJANGO_WEBHOOK_URL hoặc ODOO_WEBHOOK_SECRET")
            return

        endpoint = f"{django_url.rstrip('/')}/users/"
        payload = {
            'django_id': record.x_django_id,
            'name': record.name,
            'x_role': record.x_role,
            'x_bio': record.x_bio or "",
            'phone': record.phone or "",
            'street': record.street or "",
        }
        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }
        try:
            response = requests.post(endpoint, json=payload, headers=headers, timeout=5)
            response.raise_for_status()
        except Exception as e:
            _logger.error(f"Lỗi đồng bộ sang Web Django: {e}")
            
            raise UserError("Mất kết nối với hệ thống Web. Đã hoàn tác chỉnh sửa để đảm bảo dữ liệu không bị lệch!")