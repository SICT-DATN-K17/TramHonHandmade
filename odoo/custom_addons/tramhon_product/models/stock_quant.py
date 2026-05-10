from odoo import models, api
import logging

_logger = logging.getLogger(__name__)

class StockQuant(models.Model):
    _inherit = 'stock.quant'

    def action_apply_inventory_safe(self):
        self.action_apply_inventory()
        return True
    
    def write(self, vals):
        res = super(StockQuant, self).write(vals)
        if 'quantity' in vals or 'inventory_quantity' in vals:
            self._trigger_product_webhook()
        return res

    @api.model_create_multi
    def create(self, vals_list):
        records = super(StockQuant, self).create(vals_list)
        records._trigger_product_webhook()
        return records

    def _trigger_product_webhook(self):
        for quant in self:
            product_tmpl = quant.product_id.product_tmpl_id
            if product_tmpl and product_tmpl.x_django_id:
                product_tmpl._send_webhook_to_django(product_tmpl)