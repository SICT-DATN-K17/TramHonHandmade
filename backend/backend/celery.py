import os
from celery import Celery
from celery.signals import worker_process_init

# Trỏ biến môi trường về đúng file settings của project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Khởi tạo Celery app với tên là 'backend' (trùng tên thư mục cấu hình)
app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@worker_process_init.connect
def init_celery_worker(**kwargs):
    from services.odoo_client import odoo
    try:
        odoo.connect()
        print("Celery Worker: Đã khởi tạo kết nối Odoo sẵn sàng!")
    except Exception as e:
        print(f"Celery Worker: Lỗi pre-connect Odoo (Sẽ thử lại sau): {e}")

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')