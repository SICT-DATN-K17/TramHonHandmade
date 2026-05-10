from rest_framework.permissions import BasePermission

class IsOwnerOrArtisan(BasePermission):
    message = "Bạn không có quyền truy cập đơn hàng này."

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'is_system_admin', False):
            return True
            
        if obj.customer == request.user:
            return True
            
        if obj.artisan == request.user and getattr(request.user, 'is_artisan', False):
            return True
            
        return False