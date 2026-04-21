from odoo import models, fields, api
import os
import requests
import logging

_logger = logging.getLogger(__name__)

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_django_id = fields.Integer(string='Django Order ID', index=True, copy=False)
    x_artisan_id = fields.Many2one('res.partner', string='Nghệ nhân', domain="[('x_role', '=', 'ARTISAN')]")
    x_web_address = fields.Text(string='Địa chỉ giao hàng (Web)')
    x_web_phone = fields.Char(string='SĐT (Web)')
    x_web_note = fields.Text(string='Ghi chú của khách (Web)')
    x_payment_method = fields.Char(string='Phương thức thanh toán')
    x_web_status = fields.Char(string='Trạng thái Web', help="VD: PENDING, COMPLETED...")

    def write(self, vals):
        res = super(SaleOrder, self).write(vals)
        
        # Bắt sự kiện: Nếu trạng thái đơn (state) thay đổi thì bắn Webhook
        if 'state' in vals or 'x_web_status' in vals:
            for record in self:
                if record.x_django_id:
                    record._send_webhook_to_django()
        return res

    def _send_webhook_to_django(self):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')

        if not django_url or not secret_token:
            return

        endpoint = f"{django_url.rstrip('/')}/orders/" 

        mapped_status = None
        # Chỉ bắn Webhook nếu Sale Order bị HỦY
        if self.state == 'cancel':
            mapped_status = 'CANCELLED'
            
        if self.x_web_status and 'x_web_status' in self._fields:
            mapped_status = self.x_web_status

        if not mapped_status:
            return

        payload = {
            'django_id': self.x_django_id,
            'status': mapped_status,
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }

        try:
            requests.post(endpoint, json=payload, headers=headers, timeout=3)
        except Exception as e:
            _logger.error(f"Lỗi bắn Webhook Order {self.x_django_id} sang Django: {e}")