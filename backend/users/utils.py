from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import os
import logging

# Khởi tạo logger
logger = logging.getLogger(__name__)


def send_registration_otp(to_email, otp):
    """
    Gửi email chứa mã OTP để xác thực đăng ký.
    """
    try: # Thêm try-except để bắt lỗi gửi mail
        subject = "Trạm Hồn - Mã xác thực đăng ký"
        context = {
            'otp': otp,
        }
        html_message = render_to_string('emails/otp-email.html', context)

        send_mail(
            subject,
            f'Mã OTP của bạn là: {otp}',  # Fallback nếu email client không hiển thị HTML
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Lỗi gửi email OTP đăng ký tới {to_email}: {e}")


def send_account_verified_email(to_email, name):
    """
    Gửi email thông báo tài khoản đã được xác thực thành công.
    """
    try:
        subject = "Trạm Hồn - Tài khoản của bạn đã được xác thực"
        login_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + "/login"
        context = {
            'name': name,
            'loginUrl': login_url,
        }
        html_message = render_to_string('emails/account_verified.html', context)

        send_mail(
            subject,
            f'Chào {name}, tài khoản của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.',
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            html_message=html_message
        )
    except Exception as e:
        logger.error(f"Lỗi gửi email xác thực tài khoản tới {to_email}: {e}")


def send_password_reset_otp(to_email, name, otp):
    """
    Gửi email chứa mã OTP để đặt lại mật khẩu.
    """
    try:
        subject = "Trạm Hồn - Mã OTP đặt lại mật khẩu"
        context = {
            'name': name,
            'otp': otp,
        }
        html_message = render_to_string('emails/otp-forgot-password.html', context)

        send_mail(
            subject,
            f'Mã OTP đặt lại mật khẩu của bạn là: {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            html_message=html_message
        )
    except Exception as e:
        logger.error(f"Lỗi gửi email OTP quên mật khẩu tới {to_email}: {e}")


def send_password_reset_success_email(to_email, name):
    """
    Gửi email thông báo đặt lại mật khẩu thành công.
    """
    try:
        subject = "Trạm Hồn - Đặt lại mật khẩu thành công"
        login_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + "/login"
        context = {
            'name': name,
            'loginUrl': login_url,
        }
        html_message = render_to_string('emails/reset-password-success.html', context)

        send_mail(subject, 'Mật khẩu của bạn đã được đặt lại thành công.', settings.DEFAULT_FROM_EMAIL, [to_email], html_message=html_message)
    except Exception as e:
        logger.error(f"Lỗi gửi email báo đặt lại mật khẩu thành công tới {to_email}: {e}")