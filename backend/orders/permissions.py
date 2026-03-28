from rest_framework.permissions import BasePermission

class IsOwnerOrArtisan(BasePermission):
    """
    Cho phép: 
    - Khách hàng (Customer) xem đơn hàng của chính mình.
    - Nghệ nhân (Artisan) xem đơn hàng do mình phụ trách.
    - Admin hệ thống xem mọi thứ.
    """
    message = "Bạn không có quyền truy cập đơn hàng này."

    def has_object_permission(self, request, view, obj):
        # Admin hệ thống có toàn quyền
        if getattr(request.user, 'is_system_admin', False):
            return True
            
        # Chủ đơn hàng (Customer) có quyền
        if obj.customer == request.user:
            return True
            
        # Nghệ nhân phụ trách đơn hàng này có quyền
        if obj.artisan == request.user and getattr(request.user, 'is_artisan', False):
            return True
            
        return False