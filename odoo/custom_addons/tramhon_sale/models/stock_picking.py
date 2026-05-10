from odoo import models, api
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)

class StockPicking(models.Model):
    _inherit = 'stock.picking'

    def action_assign(self):
        res = super(StockPicking, self).action_assign()
        
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id and picking.state == 'assigned':
                if picking.sale_id.x_web_status != 'PACKAGING':
                    try:
                        picking.sale_id.write({'x_web_status': 'PACKAGING'})
                    except UserError as e:
                        raise UserError(f"Không thể Đóng gói: Mất kết nối đồng bộ Web!\nChi tiết: {e}")
        return res

    def _action_done(self):
        res = super(StockPicking, self)._action_done()
        
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id:
                if picking.sale_id.x_web_status != 'SHIPPING':
                    try:
                        picking.sale_id.write({'x_web_status': 'SHIPPING'})
                    except UserError as e:
                        raise UserError(f"Không thể Giao hàng: Mất kết nối đồng bộ Web!\nChi tiết: {e}")
        return res

    def do_unreserve(self):
        res = super(StockPicking, self).do_unreserve()
        for picking in self:
            if picking.sale_id and picking.sale_id.x_django_id and picking.state in ['confirmed', 'waiting']:
                if picking.sale_id.x_web_status != 'PENDING_PICKUP':
                    try:
                        picking.sale_id.write({'x_web_status': 'PENDING_PICKUP'})
                    except UserError as e:
                        raise UserError(f"Lỗi hoàn trạng thái chờ lấy hàng: {e}")
        return res