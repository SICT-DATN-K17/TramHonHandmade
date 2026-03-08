from rest_framework import serializers
from.models import *
from rest_framework.decorators import action

class ProductSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', required=False, allow_null=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'image', 'quantity_sold', 'stock_quantity', 'category_id', 'description', 'category_name', 'status', 'created_at', 'updated_at']
    
    def validate_image(self, value):
        """Convert null/empty/undefined strings to empty string"""
        if value is None or value == 'null' or value == 'undefined' or value == '':
            return ''
        return value


class CategorySerializer(serializers.ModelSerializer):
    category_id= serializers.IntegerField(source= 'id')
    category_name= serializers.CharField(source= 'name')
    parent_id= serializers.PrimaryKeyRelatedField(queryset= Category.objects.all(), source= 'parent', allow_null=True)
    sold_count= serializers.SerializerMethodField()
    class Meta:
        model= Category
        fields= ['category_id', 'category_name', 'parent_id', 'slug', 'created_at', 'updated_at', 'sold_count']
    
    def get_sold_count(self, obj):
        return getattr(obj, 'sold_count', 0)