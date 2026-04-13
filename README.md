# Trạm Hồn (Soul Station)
**Nền tảng Thương mại Điện tử Đồ thủ công cá nhân hóa - Ứng dụng Kiến trúc Headless & Tích hợp Odoo ERP**

![Project Status](https://img.shields.io/badge/Status-Active_Development-success)
![Architecture](https://img.shields.io/badge/Architecture-Headless%20%2B%20BFF-blue)
![ERP](https://img.shields.io/badge/ERP-Odoo_16-purple)

Trạm Hồn là một hệ thống thương mại điện tử đa nhà cung cấp (Multi-vendor) dành riêng cho các sản phẩm thủ công (handmade) độc bản. Khác với các website nguyên khối truyền thống, dự án này được thiết kế theo kiến trúc **Headless Commerce**, sử dụng Django DRF làm cổng API trung tâm (BFF - Backend for Frontend) để đồng bộ hóa giao dịch thời gian thực với hệ thống quản trị nội bộ **Odoo ERP**.



## Tính năng nổi bật (Key Features)

* Kiến trúc phân tán: Tách biệt hoàn toàn Frontend (Next.js) và Backend logic, tối ưu hiệu năng và khả năng mở rộng đa kênh.
* Tích hợp sâu Odoo ERP: Tự động đồng bộ hóa toàn bộ dữ liệu Đơn hàng, Tồn kho nguyên vật liệu và thông tin Đối tác (Vendors) sang hệ thống Odoo 16 qua giao thức XML-RPC.
* Real-time Chat & Deal: Ứng dụng WebSockets và Redis cho phép Khách hàng và Nghệ nhân trực tiếp nhắn tin, thỏa thuận ý tưởng cá nhân hóa và chốt đơn ngay trong khung chat.
* Multi-vendor Dashboard: Không gian làm việc độc lập cho các Nghệ nhân tự quản lý sản phẩm, trong khi hệ thống Admin kiểm soát tập trung toàn bộ doanh thu qua Odoo.

## Nền tảng Công nghệ (Tech Stack)

* **Frontend (Storefront & Vendor Panel):** Next.js, React, TailwindCSS.
* **Backend API (BFF Gateway):** Django 5.x, Django REST Framework, Django Channels (WebSockets).
* **Core ERP (Back-office):** Odoo 16, XML-RPC.
* **Database & Caching:** PostgreSQL 15 (Odoo), MySQL (Django), Redis (Chat).

## Cấu trúc dự án (Monorepo)

```text
TramHonHandmade/
├── backend/            # Django REST API (Xử lý logic, Chat, Đồng bộ ERP)
├── frontend/           # Next.js App (Giao diện người dùng cuối & Nghệ nhân)
├── odoo/               # Cấu hình Docker cho Odoo 16 & Custom Addons
│   ├── custom_addons/  # Các module tùy chỉnh mở rộng nghiệp vụ Odoo
│   └── docker-compose.yml
└── README.md

Hướng dẫn cài đặt (Local Development)
Dự án yêu cầu máy tính đã cài đặt: Python 3.10+, Node.js 18+, và Docker Desktop.

1. Khởi chạy hệ thống ERP (Odoo & PostgreSQL)
Bash

cd odoo
docker-compose up -d
Truy cập Odoo tại: http://localhost:8070

2. Khởi chạy Backend API (Django)
Bash

cd backend
python -m venv env
# Kích hoạt môi trường ảo (Windows: .\env\Scripts\activate | Mac/Linux: source env/bin/activate)
pip install -r requirement.txt
python manage.py migrate
python manage.py runserver
API Gateway chạy tại: http://localhost:8000

3. Khởi chạy Celery
cd backend
.\env\Scripts\activate
celery -A backend worker -l INFO --pool=solo

4. Khởi chạy Frontend (Next.js)
Bash

cd frontend
npm install
npm run dev
Giao diện Web chạy tại: http://localhost:3000