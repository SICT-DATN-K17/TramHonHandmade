from odoo import models, fields

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_django_id = fields.Integer(string='Django Order ID', index=True, copy=False)
    
    x_artisan_id = fields.Many2one(
        'res.partner', 
        string='Nghệ nhân chế tác', 
        domain="[('x_role', '=', 'ARTISAN')]"
    )

    x_web_address = fields.Text(string='Địa chỉ giao hàng (Web)')
    x_web_phone = fields.Char(string='SĐT (Web)')
    x_web_note = fields.Text(string='Ghi chú của khách (Web)')
    
    x_payment_method = fields.Char(string='Phương thức thanh toán')
    x_web_status = fields.Char(string='Trạng thái Web', help="VD: PENDING, COMPLETED...")
