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