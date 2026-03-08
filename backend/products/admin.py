from django.contrib import admin
from .models import *
from django.contrib.admin import ModelAdmin

# Register your models here.


class CategoryAdmin(ModelAdmin):
    search_fields= ['name', 'id']
    list_display= ['id', 'name']


class ProductAdmin(ModelAdmin):
    search_fields=['name', 'id']
    list_filter=['category']
    list_display=['id', 'name', 'category', 'price']
    fieldsets=[
        ('Category', {'fields': ['category']}),
        ('Product', {'fields': ['name', 'description', 'price', 'image', 'status', 'stock_quantity']})
    ]



admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.site_header = 'Administrator page'
admin.site.site_title = 'Admin site'
admin.site.index_title = ''