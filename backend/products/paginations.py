from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPagination(PageNumberPagination):
    # Cấu hình mặc định
    page_size = 24
    page_size_query_param = 'size'  # Cho phép client chỉnh size qua param ?size=
    max_page_size = 2000

    def get_page_number(self, request, paginator):
        # Lấy số trang từ query param, mặc định là 0 cho trang đầu tiên
        page_number = request.query_params.get(self.page_query_param, 0)
        try:
            # Chuyển đổi sang số nguyên và +1 vì Paginator của Django là 1-based
            page_number = int(page_number) + 1
        except (TypeError, ValueError):
            page_number = 1
        return page_number
    

    def get_paginated_response(self, data):
        # Tính toán các thông số
        total_elements = self.page.paginator.count
        total_pages = self.page.paginator.num_pages
        page_size = self.get_page_size(self.request)
        
        # Paginator của DRF là 1-based, ta trừ 1 để response là 0-based
        current_page = self.page.number - 1 

        return Response({
            'content': data, 
            'size': page_size,
            'totalElements': total_elements,
            'totalPages': total_pages,
            'currentPage': current_page
        })