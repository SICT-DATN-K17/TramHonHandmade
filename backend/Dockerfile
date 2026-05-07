# Sử dụng Python 3.10 (có thể đổi phiên bản khớp với máy ông đang chạy)
FROM python:3.10-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho MySQL client và Odoo RPC
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements.txt và cài đặt thư viện Python
COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

# Copy toàn bộ source code backend vào
COPY . .

# Mở cổng 8000
EXPOSE 8000

# Lệnh khởi chạy mặc định (dành cho API server)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]