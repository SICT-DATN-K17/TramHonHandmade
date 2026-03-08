from django.contrib import admin
from .models import *


class OderItemInline(admin.StackedInline):
    model= OrderItem
    extra= 1


class OrderAdmin(admin.ModelAdmin):
    list_display= ['customer', 'total_price', 'status', 'payment_method']
    list_filter= ['status', 'payment_method']
    search_fields= ['customer', 'status', 'total_price']
    inlines= [OderItemInline]
    
    fieldsets= [
        ('Customer', {'fields': ['customer']}),
        ('Artisan', {'fields': ['artisan']}),
        ('Chat', {'fields': ['chat']}),
        ('Order', {'fields': ['total_price', 'status', 'phone_number', 'address', 'payment_method', 'note']}),
    ]


class OrderItemAdmin(admin.ModelAdmin):
    list_display= ['product', 'quantity']
    list_filter= ['order']
    search_fields= ['order', 'product']
    
    fieldsets= [
        ('Order', {'fields': ['order']}),
        ('Product', {'fields': ['product', 'product_name']}),
        ('Order Item', {'fields': ['quantity', 'price_order']}),
    ]


admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem, OrderItemAdmin)