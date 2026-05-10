from odoo import models, fields, api
from odoo.exceptions import UserError

class AccountMove(models.Model):
    _inherit = 'account.move'

    def action_register_payment(self):
        for move in self:
            sale_orders = move.invoice_line_ids.mapped('sale_line_ids.order_id')
            for so in sale_orders:
                if so.x_django_id and so.x_web_status not in ['DELIVERED', 'COMPLETED']:
                    raise UserError("Đơn hàng chưa được giao xong, không thể hoàn tất.")
        
        return super(AccountMove, self).action_register_payment()

    @api.depends('amount_residual', 'state')
    def _compute_payment_state(self):
        super(AccountMove, self)._compute_payment_state()
        for move in self:
            if move.id and move.payment_state in ('paid', 'in_payment'):
                sale_orders = move.invoice_line_ids.mapped('sale_line_ids.order_id')
                for so in sale_orders:
                    if so.x_django_id and so.x_web_status == 'DELIVERED':
                        try:
                            so.sudo().write({'x_web_status': 'COMPLETED'})
                        except UserError as e:
                            raise UserError(f"Thanh toán thành công nhưng lỗi đồng bộ sang Web: {e}")