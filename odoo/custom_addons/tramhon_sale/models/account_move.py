from odoo import models, fields, api
from odoo.exceptions import UserError

class AccountMove(models.Model):
    _inherit = 'account.move'

    def action_register_payment(self):
        # 1. KIỂM TRA TRƯỚC KHI CHO PHÉP BẤM NÚT "GHI NHẬN THANH TOÁN"
        for move in self:
            # Lấy các Sale Order liên kết với hóa đơn này
            sale_orders = move.invoice_line_ids.mapped('sale_line_ids.order_id')
            for so in sale_orders:
                # Nếu là đơn từ Trạm Hồn (có x_django_id) và chưa nằm ở bước Đã giao hàng / Hoàn thành
                if so.x_django_id and so.x_web_status not in ['DELIVERED', 'COMPLETED']:
                    raise UserError("Đơn hàng chưa được giao xong, không thể hoàn tất.")
        
        # Nếu vượt qua check thì mở popup thanh toán như bình thường
        return super(AccountMove, self).action_register_payment()

    @api.depends('amount_residual', 'state')
    def _compute_payment_state(self):
        # 2. TỰ ĐỘNG CHUYỂN SO SANG "COMPLETED" KHI HÓA ĐƠN ĐƯỢC TRẢ ĐỦ
        super(AccountMove, self)._compute_payment_state()
        for move in self:
            # Nếu hóa đơn đã tồn tại và trạng thái là 'paid' (Đã thanh toán) hoặc 'in_payment' (Đang thanh toán)
            if move.id and move.payment_state in ('paid', 'in_payment'):
                sale_orders = move.invoice_line_ids.mapped('sale_line_ids.order_id')
                for so in sale_orders:
                    # Chỉ đẩy lên COMPLETED nếu nó đang dừng ở DELIVERED
                    if so.x_django_id and so.x_web_status == 'DELIVERED':
                        # Dùng sudo() để đảm bảo quyền ghi đè, kích hoạt hàm write() bên sale.order bắn Webhook
                        so.sudo().write({'x_web_status': 'COMPLETED'})