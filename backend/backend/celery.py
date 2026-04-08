import os
from celery import Celery

# Trỏ biến môi trường về đúng file settings của project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Khởi tạo Celery app với tên là 'backend' (trùng tên thư mục cấu hình)
app = Celery('backend')

# Nạp cấu hình từ file settings.py, bắt buộc phải có tiền tố CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tự động tìm file tasks.py trong tất cả các app (products, orders, users...)
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')