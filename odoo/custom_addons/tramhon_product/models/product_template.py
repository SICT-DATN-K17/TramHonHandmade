from odoo import models, fields

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    x_django_id = fields.Integer(string='Django Product ID', index=True, copy=False)
    x_artisan_id = fields.Many2one(
        'res.partner', 
        string='Nghệ nhân chế tác', 
        domain="[('x_role', '=', 'ARTISAN')]"
    )
    x_image_url = fields.Char(string='URL Ảnh')

    # Các cột khác Odoo ĐÃ CÓ SẴN (Lúc đồng bộ bằng Celery mình sẽ map thẳng vào):
    # - `name` -> `name`
    # - `price` -> `list_price`
    # - `description` -> `description_sale`
    # - `category_id` -> `categ_id` (Many2one trỏ về product.category)