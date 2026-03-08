from rest_framework.permissions import BasePermission


class IsParticipantOrAdmin(BasePermission):
    """
    Permission tùy chỉnh để chỉ cho phép người tham gia cuộc trò chuyện hoặc admin
    tương tác với nó.
    """
    message = "Bạn không có quyền truy cập cuộc trò chuyện này."

    def has_permission(self, request, view):
        """Cho phép truy cập nếu người dùng đã xác thực."""
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """Kiểm tra xem người dùng có phải là người tham gia hoặc admin."""
        if request.user and request.user.is_staff:
            return True
        return obj.customer == request.user or obj.artisan == request.user