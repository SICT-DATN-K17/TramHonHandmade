from odoo import models, api
import logging

_logger = logging.getLogger(__name__)

class StockPicking(models.Model):
    _inherit = 'stock.picking'

    def action_assign(self):
        res = super(StockPicking, self).action_assign()
        
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id and picking.state == 'assigned':
                if picking.sale_id.x_web_status != 'PACKAGING':
                    picking.sale_id.write({'x_web_status': 'PACKAGING'})
                    _logger.info(f"Picking {picking.name} ASSIGNED -> Cập nhật SO {picking.sale_id.name} thành PACKAGING")
        return res

    def _action_done(self):
        res = super(StockPicking, self)._action_done()
        
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id:
                if picking.sale_id.x_web_status != 'SHIPPING':
                    picking.sale_id.write({'x_web_status': 'SHIPPING'})
                    _logger.info(f"Picking {picking.name} DONE -> Cập nhật SO {picking.sale_id.name} thành SHIPPING")
        return res

    def do_unreserve(self):
        res = super(StockPicking, self).do_unreserve()
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id and picking.state in ['confirmed', 'waiting']:
                if picking.sale_id.x_web_status != 'PENDING_PICKUP':
                    picking.sale_id.write({'x_web_status': 'PENDING_PICKUP'})
        return res