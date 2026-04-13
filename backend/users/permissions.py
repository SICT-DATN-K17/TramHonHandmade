from rest_framework import permissions

class IsSystemAdmin(permissions.BasePermission):
    """Chỉ có Admin tổng mới được phép"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_system_admin', False))

class IsArtisan(permissions.BasePermission):
    """Chỉ có Nghệ nhân mới được phép"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_artisan', False))

class IsCustomer(permissions.BasePermission):
    """Chỉ có Khách hàng mới được phép"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_customer', False))

class IsArtisanOrAdmin(permissions.BasePermission):
    """Nghệ nhân hoặc Admin tổng đều được"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'is_artisan', False) or getattr(request.user, 'is_system_admin', False)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Quyền thao tác trên Object: 
    - Bất kỳ ai (kể cả chưa đăng nhập) cũng có thể XEM (GET).
    - Chỉ CHỦ SỞ HỮU (Owner) mới được phép SỬA/XÓA (PUT, PATCH, DELETE).
    """
    def has_object_permission(self, request, view, obj):
        # Các request chỉ đọc (GET, HEAD, OPTIONS) luôn được phép qua
        if request.method in permissions.SAFE_METHODS:
            return True

        # Đối với request ghi (PATCH, PUT), kiểm tra xem user đang request có phải là user bị sửa không
        return obj == request.user