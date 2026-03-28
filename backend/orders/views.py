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
from .services import create_order_from_request

class OrderViewSet(ModelViewSet):
    # Khai báo gốc, sẽ bị filter ở get_queryset
    queryset = Order.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'create_legacy']:
            return OrderRequestSerializer
        if self.action in ['my_orders', 'retrieve']:
            return OrderDetailSerializer # Dùng chung cho khách lấy 1 hoặc nhiều đơn
        if self.action in ['list', 'artisan_all']:
            return AdminOrderListSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        # Ai đăng nhập cũng được tạo đơn, lấy list đơn của mình
        if self.action in ['create', 'create_legacy', 'my_orders', 'list', 'artisan_all']:
            return [permissions.IsAuthenticated()]
        
        # Xem chi tiết, cập nhật trạng thái, hủy đơn -> Phải qua cửa kiểm duyệt
        if self.action in ['retrieve', 'cancel', 'update_status', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrArtisan()]
        
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        """
        Logic cốt lõi để chia bài:
        - Admin: Xem hết.
        - Artisan: Xem đơn hàng gán cho mình.
        - Khách hàng: Xem đơn hàng mình đặt.
        """
        user = self.request.user
        
        if getattr(user, 'is_system_admin', False):
            return super().get_queryset()
            
        if getattr(user, 'is_artisan', False):
            return super().get_queryset().filter(artisan=user)
            
        # Mặc định là Khách hàng (Customer)
        return super().get_queryset().filter(customer=user)

    def create(self, request, *args, **kwargs):
        """Handles the creation of a new order."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            # Gán thẳng artisan=1 tạm thời, nếu muốn Multi-vendor xịn thì frontend phải truyền artisan_id
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
        """Trả về đơn hàng của người đang đăng nhập (Tự động rẽ nhánh dựa vào get_queryset)"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='artisan/all')
    def artisan_all(self, request):
        """
        Dành cho Dashboard của Artisan. 
        Thực ra dùng chung get_queryset() là đã đủ bảo mật rồi.
        """
        # Nếu không phải Artisan hoặc Admin thì đá ra ngoài
        if not getattr(request.user, 'is_artisan', False) and not getattr(request.user, 'is_system_admin', False):
            return Response({"message": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'], url_path='status')
    def update_status(self, request, pk=None):
        """Cập nhật trạng thái đơn hàng (Chỉ Artisan của đơn đó hoặc Admin mới làm được)"""
        order = self.get_object() # Đã tự động gọi hàm IsOwnerOrArtisan kiểm tra quyền
        new_status = request.query_params.get('status', '').upper()

        if not new_status or new_status not in [s[0] for s in Order.STATUS_CHOICES]:
            return Response({"message": "Trạng thái không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save(update_fields=['status'])
        return Response({"id": order.id, "status": order.status, "message": "Cập nhật trạng thái thành công"})

    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        """Hủy đơn (Chủ đơn hoặc Artisan/Admin)"""
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