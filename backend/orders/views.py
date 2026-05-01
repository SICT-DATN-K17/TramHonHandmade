import os
import logging
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db import transaction

from .models import Order
from .serializers import (
    OrderRequestSerializer,
    OrderDetailSerializer,
    AdminOrderListSerializer,
    OrderProgressResponseSerializer,
    OrderStatusUpdateResponseSerializer,
)
from .permissions import IsOwnerOrArtisan
from .services import create_order_from_request, refund_stock_redis
from .tasks import *

logger = logging.getLogger(__name__)

class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'create_legacy']:
            return OrderRequestSerializer
        if self.action in ['my_orders', 'retrieve']:
            return OrderDetailSerializer
        if self.action in ['list', 'artisan_all']:
            return AdminOrderListSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'create_legacy', 'my_orders', 'list', 'artisan_all']:
            return [permissions.IsAuthenticated()]
        
        if self.action in ['retrieve', 'cancel', 'update_status', 'update', 'partial_update', 'confirm_delivery']:
            return [permissions.IsAuthenticated(), IsOwnerOrArtisan()]
        
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        
        if getattr(user, 'is_system_admin', False):
            return super().get_queryset()
            
        if getattr(user, 'is_artisan', False):
            return super().get_queryset().filter(artisan=user)
            
        return super().get_queryset().filter(customer=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = create_order_from_request(serializer.validated_data, request.user)
            response_serializer = OrderDetailSerializer(order, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"detail": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Lỗi tạo đơn hàng: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='create')
    def create_legacy(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='artisan/all')
    def artisan_all(self, request):
        if not getattr(request.user, 'is_artisan', False) and not getattr(request.user, 'is_system_admin', False):
            return Response({"message": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.query_params.get('status', '').upper()

        if not new_status or new_status not in [s[0] for s in Order.STATUS_CHOICES]:
            return Response({"message": "Trạng thái không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save(update_fields=['status'])
        return Response({"id": order.id, "status": order.status, "message": "Cập nhật trạng thái thành công"})

    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        if order.status.upper() in ['COMPLETED', 'CANCELLED', 'REFUNDED']:
            return Response({"message": "Không thể hủy đơn hàng đã hoàn tất, đã hủy hoặc đã hoàn tiền!"}, status=status.HTTP_400_BAD_REQUEST)

        cancel_note = request.data.get('note', '')

        with transaction.atomic():
            for item in order.items.all():
                if item.product:
                    refund_stock_redis(item.product.id, item.quantity)
                    
                    item.product.quantity_sold -= item.quantity
                    item.product.save(update_fields=['quantity_sold'])
            
            order.status = 'CANCELLED'
            
            if cancel_note:
                if order.note:
                    order.note = f"{order.note}\n---\n{cancel_note}"
                else:
                    order.note = cancel_note

            order.save(update_fields=['status', 'note'])

        cancel_order_in_odoo_task.delay(order.id)

        return Response({"message": f"Đã hủy đơn hàng thành công. Trạng thái: {order.status}"}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['put'], url_path='confirm-delivery')
    def confirm_delivery(self, request, pk=None):
        order = self.get_object()
        
        if order.status not in ['SHIPPING', 'DELIVERED_AWAITING']:
            return Response({"message": "Đơn hàng chưa thể xác nhận nhận hàng lúc này!"}, status=status.HTTP_400_BAD_REQUEST)
            
        order.status = 'DELIVERED'
        order.save(update_fields=['status'])
        
        update_order_status_in_odoo_task.delay(order.id, 'DELIVERED')
        
        return Response({"message": "Cảm ơn bạn đã xác nhận nhận hàng!"}, status=status.HTTP_200_OK)

class OdooWebhookOrderView(APIView):
    permission_classes = [] # RẤT QUAN TRỌNG: Mở toang cửa không bắt Auth để Odoo có thể gọi vào
    
    def post(self, request):
        # 1. Xác thực bảo mật bằng Token
        secret_token = request.headers.get('X-Odoo-Token')
        if secret_token != os.environ.get('ODOO_WEBHOOK_SECRET'):
            return Response({"error": "Unauthorized. Webhook Token không khớp!"}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        django_id = data.get('django_id')
        new_status = data.get('status')
        
        if not django_id or not new_status:
            return Response({"error": "Thiếu dữ liệu (django_id hoặc status)"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from .models import Order
            # Update trực tiếp trạng thái mà không cần chọc vào ORM lấy object ra (tối ưu hiệu năng)
            updated_count = Order.objects.filter(id=django_id).update(status=new_status)
            
            if updated_count:
                logger.info(f"Webhook: Đã cập nhật Order ID {django_id} thành trạng thái '{new_status}' từ Odoo.")
            else:
                logger.warning(f"Webhook: Odoo gửi Order ID {django_id} nhưng không tìm thấy trong DB Django.")
                
            return Response({"status": "success"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Lỗi xử lý Webhook Order từ Odoo: {e}")
            return Response({"error": "Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)