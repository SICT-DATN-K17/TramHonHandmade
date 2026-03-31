from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsArtisanOrReadOnly(BasePermission):
    """
    - Bất kỳ ai đều được đọc (GET, HEAD, OPTIONS).
    - Chỉ Nghệ nhân tạo ra sản phẩm đó, hoặc Admin hệ thống mới được sửa/xóa.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
            
        user = request.user
        if not user or not user.is_authenticated:
            return False

        role = getattr(user, 'role', '')

        if role == 'ADMIN' or getattr(user, 'is_superuser', False):
            return True

        return obj.artisan == user and role == 'ARTISAN'