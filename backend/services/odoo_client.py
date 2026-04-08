import xmlrpc.client
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class OdooClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OdooClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.url = settings.ODOO_URL
        self.db = settings.ODOO_DB
        self.username = settings.ODOO_USER
        self.password = settings.ODOO_PASSWORD
        self.uid = None
        self.models = None

        try:
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            
            if self.uid:
                self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
                logger.info(f"Kết nối Odoo thành công! UID: {self.uid}")
            else:
                logger.error("Sai thông tin đăng nhập Odoo (Email hoặc Mật khẩu).")
        except Exception as e:
            logger.error(f"Không thể kết nối tới server Odoo: {e}")

    def execute(self, model_name, method_name, *args, **kwargs):
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

odoo = OdooClient()