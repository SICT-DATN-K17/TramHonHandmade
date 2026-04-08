from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce, Lower
import logging

from .models import *
from .serializers import *
from .permissions import IsArtisanOrReadOnly
from .paginations import CustomPagination

logger = logging.getLogger(__name__)

class ProductViewset(ModelViewSet):
    queryset = Product.objects.all() 
    serializer_class = ProductSerializer
    pagination_class = CustomPagination
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtisanOrReadOnly]
    
    def perform_create(self, serializer):
        user = self.request.user
        role = getattr(user, 'role', '')
        
        if role in ['ARTISAN', 'ADMIN'] or getattr(user, 'is_superuser', False):
            validated_data = serializer.validated_data
            status = validated_data.get('status', 'ACTIVE')
            category = validated_data.get('category')
            
            if status == 'HIDDEN' or not category:
                custom_cat = Category.objects.filter(name="Sản phẩm Tùy chỉnh").first()
                if not custom_cat:
                    custom_cat = Category.objects.create(
                        name="Sản phẩm Tùy chỉnh", 
                        slug="san-pham-tuy-chinh",
                        status="HIDDEN"
                    )
                serializer.save(artisan=user, category=custom_cat)
            else:
                serializer.save(artisan=user)
        else:
            raise PermissionDenied("Chỉ Nghệ nhân hoặc Admin mới được phép đăng sản phẩm.")

    def get_queryset(self):
        queryset = Product.objects.all()
        user = self.request.user
        
        role = getattr(user, 'role', '')
        is_admin = role == 'ADMIN' or getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False)
        is_artisan = role == 'ARTISAN'

        if is_admin:
            pass 
            
        elif is_artisan:
            queryset = queryset.filter(artisan_id=user.id)
            
        else:
            queryset = queryset.filter(status='ACTIVE')
            
            target_artisan = self.request.query_params.get('artisanId')
            if target_artisan:
                try:
                    queryset = queryset.filter(artisan_id=int(target_artisan))
                except ValueError:
                    pass

        category_id = self.request.query_params.get('categoryId')
        if category_id:
            try:
                queryset = queryset.filter(category_id=int(category_id))
            except (ValueError, TypeError):
                pass
        
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
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

    def get_queryset(self):
        queryset = Category.objects.annotate(
            sold_count=Coalesce(Sum('products__quantity_sold'), 0)
        ).order_by('-sold_count')
        user = self.request.user
        if not user.is_authenticated:
            return queryset.filter(status='ACTIVE')
        role = getattr(user, 'role', '')
        is_admin = role == 'ADMIN' or getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False)
        is_artisan = role == 'ARTISAN'
        if is_admin or is_artisan:
            return queryset
        else:
            return queryset.filter(status='ACTIVE')