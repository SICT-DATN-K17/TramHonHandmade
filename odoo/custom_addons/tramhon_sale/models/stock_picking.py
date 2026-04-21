from odoo import models, fields, api
import os
import requests
import logging

_logger = logging.getLogger(__name__)

class StockPicking(models.Model):
    _inherit = 'stock.picking'

    def write(self, vals):
        res = super(StockPicking, self).write(vals)
        
        # Bắt sự kiện mỗi khi trạng thái phiếu xuất kho thay đổi
        if 'state' in vals:
            for picking in self:
                # Chỉ lấy những phiếu xuất liên kết với Sale Order có x_django_id
                if picking.sale_id and picking.sale_id.x_django_id:
                    picking._send_webhook_to_django()
        return res

    def _send_webhook_to_django(self):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')

        if not django_url or not secret_token:
            return

        endpoint = f"{django_url.rstrip('/')}/orders/"

        # Ánh xạ trạng thái Delivery (Phiếu xuất) sang trạng thái Web
        mapped_status = None
        if self.state == 'assigned': # Có đủ hàng -> Sẵn sàng
            mapped_status = 'PACKAGING'
        elif self.state == 'done':   # Giao xong -> Hoàn tất
            mapped_status = 'SHIPPING'

        if not mapped_status:
            return

        payload = {
            'django_id': self.sale_id.x_django_id,
            'status': mapped_status,
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }

        try:
            requests.post(endpoint, json=payload, headers=headers, timeout=3)
            _logger.info(f"Đã bắn Webhook Picking {self.name} -> {mapped_status} cho Order ID {self.sale_id.x_django_id}")
        except Exception as e:
            _logger.error(f"Lỗi bắn Webhook Picking sang Django: {e}")