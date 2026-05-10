from odoo import models, fields, api
from odoo.exceptions import UserError
import os
import requests
import logging

_logger = logging.getLogger(__name__)

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    x_django_id = fields.Integer(string='Django Product ID', index=True, copy=False)
    x_artisan_id = fields.Many2one(
        'res.partner', 
        string='Nghệ nhân chế tác', 
        domain="[('x_role', '=', 'ARTISAN')]"
    )
    x_image_url = fields.Char(string='URL Ảnh', readonly=True)
    x_web_status = fields.Selection([('ACTIVE', 'Hiển thị'), ('HIDDEN', 'Ẩn')], string='Trạng thái Web', default='ACTIVE')

    def write(self, vals):
        res = super(ProductTemplate, self).write(vals)
        
        sync_fields = ['name', 'list_price', 'description_sale', 'x_web_status', 'categ_id', 'x_artisan_id']
        
        if any(key in vals for key in sync_fields):
            for record in self:
                if record.x_django_id:
                    self._send_webhook_to_django(record)

        return res

    def _send_webhook_to_django(self, record):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')

        if not django_url or not secret_token:
            _logger.error("THIẾU CẤU HÌNH BIẾN MÔI TRƯỜNG WEBHOOK")
            return

        endpoint = f"{django_url.rstrip('/')}/products/"

        payload = {
            'django_id': record.x_django_id,
            'name': record.name,
            'price': record.list_price,
            'description': record.description_sale or "",
            'active': True if record.x_web_status == 'ACTIVE' else False,
            'stock_quantity': record.qty_available, 
            'category_id': record.categ_id.x_django_id if record.categ_id else None,
            'artisan_id': record.x_artisan_id.x_django_id if record.x_artisan_id else None,
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }

        try:
            response = requests.post(endpoint, json=payload, headers=headers, timeout=5)
            response.raise_for_status()
        except Exception as e:
            _logger.error(f"Lỗi bắn Webhook Product sang Django cho SP {record.x_django_id}: {e}")
            raise UserError("Mất kết nối với hệ thống Web (Django). Đã hoàn tác chỉnh sửa sản phẩm để đảm bảo dữ liệu không bị lệch!")