from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views import *
from orders.views import OrderViewSet
from chat.views import *

router= DefaultRouter()
router.register(r'products', ProductViewset, basename='product')
router.register(r'category', CategoryViewset, basename='category')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'chat', ChatViewSet, basename='chat')


urlpatterns = [
    path('', include(router.urls)),
]
