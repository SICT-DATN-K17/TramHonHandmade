from odoo import models, fields, api
import os
import requests
import logging

_logger = logging.getLogger(__name__)

class ProductCategory(models.Model):
    _inherit = 'product.category'

    x_django_id = fields.Integer(string='Django Category ID', index=True, copy=False)
    x_slug = fields.Char(string='Slug (Django)', size=100)
    active = fields.Boolean(string='Active', default=True)
    
    def write(self, vals):
        res = super(ProductCategory, self).write(vals)
        
        sync_fields = ['name', 'x_slug', 'active']
        if any(key in vals for key in sync_fields):
            for record in self:
                if record.x_django_id:
                    self._send_webhook_to_django(record)
        return res

    def _send_webhook_to_django(self, record):
        django_url = os.environ.get('DJANGO_WEBHOOK_URL')
        secret_token = os.environ.get('ODOO_WEBHOOK_SECRET')

        if not django_url or not secret_token:
            return

        endpoint = f"{django_url.rstrip('/')}/categories/"

        payload = {
            'django_id': record.x_django_id,
            'name': record.name,
            'slug': record.x_slug or "",
            'active': record.active, 
        }

        headers = {
            'Content-Type': 'application/json',
            'X-Odoo-Token': secret_token
        }

        try:
            requests.post(endpoint, json=payload, headers=headers, timeout=3)
        except Exception as e:
            _logger.error(f"Lỗi bắn Webhook Category sang Django: {e}")