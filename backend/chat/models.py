from django.db import models
from django.conf import settings
from products.models import Product


class Chat(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('NEGOTIATING', 'Negotiating'),
        ('ORDER_CREATED', 'Order Created'),
        ('CLOSED', 'Closed'),
    ]

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_chats')
    artisan = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artisan_chats')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='chats')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    reference_image = models.TextField(null=True, blank=True)
    budget = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chats'

    def __str__(self):
        return f"{self.title} - {self.customer}"


class ChatMessage(models.Model):
    SENDER_TYPE_CHOICES = [
        ('CUSTOMER', 'Customer'),
        ('ARTISAN', 'Artisan'),
    ]
    
    TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('ORDER_PROPOSAL', 'Order Proposal'),
    ]

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    is_image = models.BooleanField(default=False)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPE_CHOICES, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TEXT')

    class Meta:
        db_table = 'chat_messages'

    def __str__(self):
        return f"Message {self.id} in Chat {self.chat_id}"
