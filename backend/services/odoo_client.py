import xmlrpc.client
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class OdooClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OdooClient, cls).__new__(cls)
            cls._instance.url = settings.ODOO_URL
            cls._instance.db = settings.ODOO_DB
            cls._instance.username = settings.ODOO_USER
            cls._instance.password = settings.ODOO_PASSWORD
            cls._instance.uid = None
            cls._instance.models = None
        return cls._instance

    def connect(self):
        if self.uid and self.models:
            return True

        try:
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.username, self.password, {})
            
            if self.uid:
                self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
                logger.info(f"Kết nối Odoo thành công! UID: {self.uid}")
                return True
            else:
                logger.error("Sai thông tin đăng nhập Odoo. Vui lòng check file .env!")
                return False
                
        except Exception as e:
            logger.error(f"Odoo chưa sẵn sàng hoặc từ chối kết nối: {e}")
            raise ConnectionError(f"Không thể kết nối tới Odoo: {e}")

    def execute(self, model_name, method_name, *args, **kwargs):
        if not self.uid or not self.models:
            self.connect()
        
        try:
            return self.models.execute_kw(
                self.db, self.uid, self.password,
                model_name, method_name, args, kwargs
            )
        except Exception as e:
            logger.error(f"Lỗi khi thực thi lệnh trên Odoo ({model_name}.{method_name}): {e}")
            self.uid = None 
            self.models = None
            raise ConnectionError(f"Thực thi lệnh thất bại: {e}")

odoo = OdooClient()