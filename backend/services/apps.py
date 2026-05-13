from django.apps import AppConfig
import sys

class ServicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services'

    def ready(self):
        # Chỉ chạy khi thực sự khởi động server (tránh chạy khi migrate)
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv:
            from .odoo_client import odoo
            try:
                # Gọi connect để đăng nhập sẵn
                odoo.connect()
                print(">>> [Dịch vụ Odoo] Đã kết nối sẵn sàng!")
            except Exception as e:
                print(f">>> [Dịch vụ Odoo] Cảnh báo khởi động: {e}")