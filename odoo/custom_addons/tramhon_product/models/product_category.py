from odoo import models, fields

class ProductCategory(models.Model):
    _inherit = 'product.category'

    x_django_id = fields.Integer(string='Django Category ID', index=True, copy=False)
    x_slug = fields.Char(string='Slug (Django)', size=100)
    active = fields.Boolean(string='Active', default=True)