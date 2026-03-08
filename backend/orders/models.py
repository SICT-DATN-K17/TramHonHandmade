from django.db import models
from django.conf import settings
from products.models import Product
from chat.models import Chat


class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders_as_customer')
    artisan = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders_as_artisan')
    chat = models.ForeignKey(Chat, on_delete=models.SET_NULL, null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    note = models.CharField(max_length=255, null=True, blank=True)
    payment_method = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'orders'

    def __str__(self):
        return f"Order {self.id} by {self.customer.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price_order = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.quantity} of {self.product_name}"
