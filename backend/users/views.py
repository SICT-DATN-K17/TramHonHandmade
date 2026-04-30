from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from .permissions import *
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status, permissions, viewsets
from .models import *
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import random
import os
import logging
from .utils import (
    send_registration_otp, send_account_verified_email, send_password_reset_otp, send_password_reset_success_email
)
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomRegisterSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data

            Otp.objects.filter(email=data['email']).delete()

            otp_code = str(random.randint(100000, 999999))
            otp_expires_at = timezone.now() + timedelta(minutes=5)

            Otp.objects.create(
                name=data['name'],
                email=data['email'],
                password=make_password(data['password']),
                code=otp_code,
                expires_at=otp_expires_at
            )

            send_registration_otp(data['email'], otp_code)

            return Response({"message": "Mã OTP đã được gửi đến email của bạn."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyAccountView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyAccountSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email']
        code = data['code']
        
        # Thoát sớm nếu người dùng đã active, xử lý trường hợp request được gửi lại.
        if CustomUser.objects.filter(email=email, is_active=True).exists():
            return Response({"message": "Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập."}, status=status.HTTP_200_OK)

        try:
            with transaction.atomic():
                # Khóa dòng OTP để xử lý race condition khi có nhiều request đồng thời
                otp_instance = Otp.objects.select_for_update().get(email=email)

                if otp_instance.expires_at < timezone.now():
                    # Logic giống backend cũ: tạo và gửi lại mã mới khi hết hạn
                    new_otp_code = str(random.randint(100000, 999999))
                    otp_instance.code = new_otp_code
                    otp_instance.expires_at = timezone.now() + timedelta(minutes=5)
                    otp_instance.save()
                    send_registration_otp(otp_instance.email, new_otp_code)
                    return Response({"error": "Mã OTP đã hết hạn! Chúng tôi đã gửi cho bạn một mã mới!"}, status=status.HTTP_400_BAD_REQUEST)

                if otp_instance.code != code:
                    return Response({"error": "Mã OTP không chính xác."}, status=status.HTTP_400_BAD_REQUEST)

                # OTP hợp lệ, kiểm tra lại lần nữa trước khi tạo user
                if CustomUser.objects.filter(email=otp_instance.email).exists():
                    otp_instance.delete()
                    return Response({"error": "Người dùng với email này đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Tạo user trực tiếp vì đã có password đã hash
                user = CustomUser(
                    name=otp_instance.name,
                    email=CustomUser.objects.normalize_email(otp_instance.email),
                    password=otp_instance.password,
                    is_active=True
                )
                user.save()

                # Clean up the OTP record
                otp_instance.delete()
                
                send_account_verified_email(user.email, user.name)
                return Response({"message": "Xác thực thành công! Tài khoản của bạn đã được tạo."}, status=status.HTTP_201_CREATED)

        except Otp.DoesNotExist:
            # Xử lý trường hợp OTP không tồn tại, có thể do race condition (request khác đã dùng)
            # Kiểm tra xem user đã được tạo chưa. Nếu rồi thì trả về thành công.
            if CustomUser.objects.filter(email=email, is_active=True).exists():
                return Response({"message": "Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập."}, status=status.HTTP_200_OK)
            return Response({"error": "Email chưa được đăng ký hoặc mã OTP không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Lỗi không xác định trong quá trình xác thực tài khoản cho {email}: {str(e)}")
            return Response({"error": "Đã xảy ra lỗi máy chủ, vui lòng thử lại sau."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = CustomUser.objects.get(email=email)

        Otp.objects.filter(email=email).delete()

        otp_code = str(random.randint(100000, 999999))
        otp_expires_at = timezone.now() + timedelta(minutes=5)

        # Lưu cả tên để gửi email cho nhất quán
        Otp.objects.create(email=email, name=user.name, code=otp_code, expires_at=otp_expires_at)

        send_password_reset_otp(user.email, user.name, otp_code)

        return Response({"message": "Mã OTP để đặt lại mật khẩu đã được gửi đến email của bạn."}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email']

        try:
            with transaction.atomic():
                otp_instance = Otp.objects.select_for_update().get(email=email)

                if otp_instance.expires_at < timezone.now():
                    new_otp_code = str(random.randint(100000, 999999))
                    otp_instance.code = new_otp_code
                    otp_instance.expires_at = timezone.now() + timedelta(minutes=5)
                    otp_instance.save()
                    send_password_reset_otp(otp_instance.email, otp_instance.name, new_otp_code)
                    return Response({"error": "Mã OTP đã hết hạn. Chúng tôi đã gửi cho bạn một mã mới!"}, status=status.HTTP_400_BAD_REQUEST)

                if otp_instance.code != data['code']:
                    return Response({"error": "Mã OTP không chính xác."}, status=status.HTTP_400_BAD_REQUEST)

                user = CustomUser.objects.get(email=email)
                user.set_password(data['new_password'])
                user.save(update_fields=['password'])

                otp_instance.delete()
                send_password_reset_success_email(user.email, user.name)

                return Response({"message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ."}, status=status.HTTP_200_OK)

        except Otp.DoesNotExist:
            return Response({"error": "Email hoặc mã OTP không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Lỗi không xác định trong quá trình đặt lại mật khẩu cho {email}: {str(e)}")


class UserViewSet(viewsets.ModelViewSet): 
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = CustomUser.objects.filter(is_active=True)
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role.upper())
        return queryset
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        allowed_data = {}
        if 'name' in request.data:
            allowed_data['name'] = request.data['name']
        if 'bio' in request.data:
            allowed_data['bio'] = request.data['bio']
        
        if not allowed_data and partial:
            return Response({"message": "Không có thông tin hợp lệ để cập nhật."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=allowed_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


class MyAddressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            address = request.user.address
            serializer = AddressSerializer(address)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Chưa thiết lập địa chỉ"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            address = request.user.address
            serializer = AddressSerializer(address, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            serializer = AddressSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OdooWebhookUserView(APIView):
    permission_classes = []
    
    def post(self, request):
        secret_token = request.headers.get('X-Odoo-Token')
        if secret_token != os.environ.get('ODOO_WEBHOOK_SECRET'):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        django_id = data.get('django_id')
        
        if not django_id:
            return Response({"error": "Missing django_id"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            update_data = {}
            if 'name' in data: 
                update_data['name'] = data['name']
            if 'x_role' in data: 
                update_data['role'] = data['x_role']
            if 'x_bio' in data: 
                update_data['bio'] = data['x_bio'] if data['x_bio'] else ""

            if update_data:
                CustomUser.objects.filter(id=django_id).update(**update_data)
                
            if 'phone' in data or 'street' in data:
                user = CustomUser.objects.get(id=django_id)
                
                addr_update_data = {}
                if 'phone' in data:
                    addr_update_data['phone_number'] = data['phone']
                if 'street' in data:
                    addr_update_data['detail_address'] = data['street']
                
                if addr_update_data:
                    updated_count = Address.objects.filter(user=user).update(**addr_update_data)
                    
                    if updated_count == 0:
                        Address.objects.bulk_create([
                            Address(
                                user=user,
                                full_name=user.name,
                                phone_number=data.get('phone', ''),
                                detail_address=data.get('street', '')
                            )
                        ])
            
            logger.info(f"Webhook: Đã cập nhật User/Address ID {django_id} từ Odoo.")
            return Response({"status": "success"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Lỗi xử lý Webhook từ Odoo: {e}")
            return Response({"error": "Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)