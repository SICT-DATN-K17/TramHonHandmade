from django.shortcuts import render
from .models import *
from .serializers import *
from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions
from .permissions import IsArtisanOrReadOnly
from .paginations import CustomPagination
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce, Lower
from .models import *
import logging

logger = logging.getLogger(__name__)

# Create your views here.
class ProductViewset(ModelViewSet):
    queryset= Product.objects.filter(status='ACTIVE')
    serializer_class= ProductSerializer
    pagination_class= CustomPagination
    permission_classes= [permissions.AllowAny, permissions.IsAuthenticatedOrReadOnly, IsArtisanOrReadOnly]
    
    def create(self, request, *args, **kwargs):
        logger.warning(f'[Products] POST request data: {request.data}')
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = Product.objects.all()
        
        is_artisan_req = self.request.query_params.get('artisan') == 'true'
        
        if not is_artisan_req:
            queryset = queryset.filter(status='ACTIVE')
        # Lọc theo categoryId
        category_id = self.request.query_params.get('categoryId')
        if category_id:
            try:
                queryset = queryset.filter(category_id=int(category_id))
            except (ValueError, TypeError):
                pass
        
        # Lọc theo từ khóa (keyword)
        keyword = self.request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(name__icontains=keyword) | Q(description__icontains=keyword)
            )
        
        min_price = self.request.query_params.get('minPrice')
        max_price = self.request.query_params.get('maxPrice')
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        
        sort_by = self.request.query_params.get('sort')
        if sort_by == 'price-asc':
            queryset = queryset.order_by('price')
        elif sort_by == 'price-desc':
            queryset = queryset.order_by('-price')
        elif sort_by == 'name-asc':
            queryset = queryset.order_by(Lower('name'))
        elif sort_by == 'name-desc':
            queryset = queryset.order_by(Lower('name').desc())
        else:
            queryset = queryset.order_by('-quantity_sold')

        return queryset

class CategoryViewset(ModelViewSet):
    queryset = Category.objects.annotate(
        sold_count=Coalesce(Sum('products__quantity_sold'), 0)
    ).order_by('-sold_count')
    serializer_class= CategorySerializer
    permission_classes= [permissions.AllowAny]