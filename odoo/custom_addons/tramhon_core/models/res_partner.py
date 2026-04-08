from odoo import models, fields

class ResPartner(models.Model):
    _inherit = 'res.partner'

    x_django_id = fields.Integer(string='Django User ID', index=True, copy=False)
    x_role = fields.Selection([
        ('CUSTOMER', 'Khách hàng'),
        ('ARTISAN', 'Nghệ nhân')
    ], string='Vai trò (Django)', default='CUSTOMER', index=True)

    x_bio = fields.Text(string='Giới thiệu/Tiểu sử')