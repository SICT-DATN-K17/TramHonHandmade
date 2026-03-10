import xmlrpc.client
import logging
from django.conf import settings

# Bật log để lúc lỗi còn biết Odoo nó chửi cái gì
logger = logging.getLogger(__name__)

class OdooClient:
    _instance = None

    def __new__(cls):
        # Đảm bảo Singleton: Chỉ tạo 1 kết nối duy nhất dù gọi ở bao nhiêu file đi nữa
        if cls._instance is None:
            cls._instance = super(OdooClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Hàm này tự động chạy 1 lần để lấy UID từ Odoo"""
        self.url = settings.ODOO_URL
        self.db = settings.ODOO_DB
        self.username = settings.ODOO_USER
        self.password = settings.ODOO_PASSWORD
        self.uid = None
        self.models = None

        try:
            # Đăng nhập lấy thẻ căn cước (UID)
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            
            if self.uid:
                # Mở cổng giao tiếp dữ liệu
                self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
                logger.info(f"Kết nối Odoo thành công! UID: {self.uid}")
            else:
                logger.error("Sai thông tin đăng nhập Odoo (Email hoặc Mật khẩu).")
        except Exception as e:
            logger.error(f"Không thể kết nối tới server Odoo: {e}")

    def execute(self, model_name, method_name, *args, **kwargs):
        """
        Hàm dùng chung để đâm chọt vào mọi bảng của Odoo
        Cách dùng: odoo.execute('res.partner', 'search', [[['name', '=', 'Hùng']]])
        """
        if not self.uid or not self.models:
            logger.error("Chưa kết nối được Odoo, không thể thực thi lệnh.")
            return None
        
        try:
            return self.models.execute_kw(
                self.db, self.uid, self.password,
                model_name, method_name, args, kwargs
            )
        except Exception as e:
            logger.error(f"Lỗi Odoo khi chạy {method_name} trên {model_name}: {e}")
            return None

# KHỞI TẠO SẴN 1 BIẾN TOÀN CỤC ĐỂ CÁC FILE KHÁC IMPORT VÀO LÀ XÀI LUÔN
odoo = OdooClient()