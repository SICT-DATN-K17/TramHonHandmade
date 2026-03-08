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
from .permissions import IsOwnerOrAdmin
from .services import create_order_from_request


class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'create_legacy']:
            return OrderRequestSerializer
        if self.action == 'retrieve':
            return OrderDetailSerializer
        if self.action == 'my_orders':
            return OrderProgressResponseSerializer
        if self.action in ['list', 'admin_all']:
            return AdminOrderListSerializer
        # Default serializer for list/update/etc.
        return OrderDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'create_legacy', 'my_orders']:
            return [permissions.IsAuthenticated()]
        # Chỉ chủ sở hữu đơn hàng hoặc Admin mới có thể xem chi tiết hoặc hủy.
        if self.action in ['retrieve', 'cancel']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        """Admins can see all orders. Regular users can only see their own orders."""
        user = self.request.user
        if user.is_staff:
            return super().get_queryset()
        return super().get_queryset().filter(customer=user)

    def create(self, request, *args, **kwargs):
        """Handles the creation of a new order."""
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
        """
        Endpoint tương thích với backend cũ để hỗ trợ POST /api/orders/create/
        Hành động này sẽ gọi trực tiếp đến phương thức `create` tiêu chuẩn.
        """
        return self.create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        """Returns all orders for the currently authenticated user."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin/all')
    def admin_all(self, request):
        """Returns all orders in the system. (Admin only)"""
        queryset = Order.objects.all().order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        """Updates the status of an order. (Admin only)"""
        order = self.get_object()
        new_status = request.query_params.get('status', '').upper()

        if not new_status or new_status not in [s[0] for s in Order.STATUS_CHOICES]:
            return Response({"message": "Trạng thái không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save(update_fields=['status'])
        response_data = {"id": order.id, "status": order.status, "message": "Cập nhật trạng thái đơn hàng thành công"}
        return Response(response_data)

    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        """Allows a user or admin to cancel an order."""
        order = self.get_object()
        if order.status not in ['PENDING', 'CONFIRMED']:
            return Response({"message": "Không thể hủy đơn hàng đang giao hoặc đã hoàn thành!"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in order.items.all():
                if item.product:
                    item.product.stock_quantity += item.quantity
                    item.product.quantity_sold -= item.quantity
                    item.product.save(update_fields=['stock_quantity', 'quantity_sold'])
            
            order.status = 'CANCELLED'
            order.save(update_fields=['status'])

        return Response({"message": f"Đã hủy đơn hàng thành công. Trạng thái: {order.status}"}, status=status.HTTP_200_OK)
