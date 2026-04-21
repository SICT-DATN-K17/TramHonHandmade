from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views import *
from orders.views import *
from chat.views import *
from users.views import *
from .views import SignatureAPIView

router= DefaultRouter()
router.register(r'products', ProductViewset, basename='product')
router.register(r'categories', CategoryViewset, basename='category')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'chat', ChatViewSet, basename='chat')
router.register(r'users', UserViewSet, basename='user')

webhook_urls= [
    path('users/', OdooWebhookUserView.as_view(), name= 'webhook_users'),
    path('products/', OdooWebhookProductView.as_view(), name= 'webhook_products'),
    path('categories/', OdooWebhookCategoryView.as_view(), name= 'webhook_categories'),
    path('orders/', OdooWebhookOrderView.as_view(), name= 'wwebhook_orders')
]

urlpatterns = [
    path('', include(router.urls)),
    path('sign-cloudinary-upload/', SignatureAPIView.as_view(), name='sign-cloudinary-upload'),
    path('webhooks/', include(webhook_urls)),
]
