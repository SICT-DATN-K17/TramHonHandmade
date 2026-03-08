from rest_framework.permissions import BasePermission


class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow owners of an object or admins to interact with it.
    """
    message = "Bạn không có quyền truy cập đơn hàng này."

    def has_object_permission(self, request, view, obj):
        # Admin users can access any order
        if request.user and request.user.is_staff:
            return True
        # The owner of the order can access it
        return obj.customer == request.user