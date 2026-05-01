from odoo import models, fields, api
import os
import requests
from datetime import timedelta
import logging

_logger = logging.getLogger(__name__)

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_django_id = fields.Integer(string='Django Order ID', index=True, copy=False)
    x_artisan_id = fields.Many2one('res.partner', string='Nghệ nhân', domain="[('x_role', '=', 'ARTISAN')]")
    x_web_address = fields.Text(string='Địa chỉ giao hàng')
    x_web_phone = fields.Char(string='SĐT')
    x_web_note = fields.Text(string='Ghi chú của khách')
    x_payment_method = fields.Char(string='Phương thức thanh toán')
    x_web_status = fields.Selection([
        ('PENDING_PICKUP', 'Đang chờ lấy hàng'),
        ('PACKAGING', 'Đang đóng gói hàng'),
        ('SHIPPING', 'Đang giao hàng'),
        ('DELIVERED_AWAITING', 'Chờ khách xác nhận'),
        ('DELIVERED', 'Đã giao hàng'),
        ('COMPLETED', 'Hoàn thành'),
        ('CANCELLED', 'Đã hủy'),
        ('REFUNDED', 'Đã hoàn tiền'),
    ], string='Trạng thái đơn hàng', default='PENDING_PICKUP', tracking=True)
    x_admin_delivered_at = fields.Datetime(string='Thời gian hoàn thành giao hàng')

    def write(self, vals):
        if vals.get('state') == 'cancel':
            vals['x_web_status'] = 'CANCELLED'

        res = super(SaleOrder, self).write(vals)
        
        if 'x_web_status' in vals:
            for record in self:
                if record.x_django_id:
                    record._send_webhook_to_django()
        return res

    def action_admin_delivered(self):
        for record in self:
            if record.x_web_status == 'SHIPPING':
                record.write({
                    'x_web_status': 'DELIVERED_AWAITING',
                    'x_admin_delivered_at': fields.Datetime.now()
                })

    @api.model
    def _cron_auto_confirm_delivery(self):
        threshold_date = fields.Datetime.now() - timedelta(days=2)
        
        orders_to_confirm = self.search([
            ('x_web_status', '=', 'DELIVERED_AWAITING'),
            ('x_admin_delivered_at', '<=', threshold_date)
        ])
        
        for order in orders_to_confirm:
            order.write({'x_web_status': 'DELIVERED'})
            _logger.info(f"Cronjob: Tự động chuyển SO {order.name} sang DELIVERED do quá 2 ngày.")

    def _send_webhook_to_django(self):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')

        if not django_url or not secret_token or not self.x_web_status:
            return

        endpoint = f"{django_url.rstrip('/')}/orders/" 

        payload = {
            'django_id': self.x_django_id,
            'status': self.x_web_status,
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }

        try:
            requests.post(endpoint, json=payload, headers=headers, timeout=3)
            _logger.info(f"Đã bắn Webhook SO {self.name} -> {self.x_web_status} cho Django ID {self.x_django_id}")
        except Exception as e:
            _logger.error(f"Lỗi bắn Webhook Order {self.x_django_id} sang Django: {e}")