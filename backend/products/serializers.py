from rest_framework import serializers
from .models import *
from rest_framework.decorators import action
from django.conf import settings
import redis
import logging

logger = logging.getLogger(__name__)

try:
    redis_client = redis.StrictRedis.from_url(settings.CACHES['default']['LOCATION'], decode_responses=True)
except Exception as e:
    redis_client = None
    logger.error(f"Lỗi kết nối Redis ở Serializer: {e}")

class ProductSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', required=False, allow_null=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    artisan_id = serializers.ReadOnlyField(source='artisan.id')
    artisan_name = serializers.ReadOnlyField(source='artisan.name')
    
    stock_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'quantity_sold', 'stock_quantity', 'category_id', 'description', 'category_name', 'status', 'created_at', 'updated_at', 'artisan_id', 'artisan_name']
    
    def validate_image(self, value):
        if value is None or value == 'null' or value == 'undefined' or value == '':
            return ''
        return value

    def get_stock_quantity(self, obj):
        if redis_client:
            try:
                stock_key = f"product_stock_{obj.id}"
                redis_stock = redis_client.get(stock_key)
                if redis_stock is not None:
                    return int(redis_stock)
            except Exception:
                pass
        
        return obj.stock_quantity


class CategorySerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source='id', read_only=True)
    category_name = serializers.CharField(source='name')
    sold_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'slug', 'status', 'created_at', 'updated_at', 'sold_count']
    
    def get_sold_count(self, obj):
        return getattr(obj, 'sold_count', 0)