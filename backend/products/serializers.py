from rest_framework import serializers
from.models import *
from rest_framework.decorators import action

class ProductSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', required=False, allow_null=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    artisan_id = serializers.ReadOnlyField(source='artisan.id')
    artisan_name = serializers.ReadOnlyField(source='artisan.name')
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'quantity_sold', 'stock_quantity', 'category_id', 'description', 'category_name', 'status', 'created_at', 'updated_at', 'artisan_id', 'artisan_name']
    
    def validate_image(self, value):
        if value is None or value == 'null' or value == 'undefined' or value == '':
            return ''
        return value


class CategorySerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source='id', read_only=True)
    category_name = serializers.CharField(source='name')
    sold_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'slug', 'status', 'created_at', 'updated_at', 'sold_count']
    
    def get_sold_count(self, obj):
        return getattr(obj, 'sold_count', 0)