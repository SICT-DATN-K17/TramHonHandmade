from django.contrib import admin
from .models import *


# Register your models here.
class ChatAdmin(admin.ModelAdmin):
    search_fields= ['title', 'product']
    list_filter= ['status']
    list_display= ['title', 'status', 'customer']
    
    fieldsets= [
        ('Customer', {'fields': ['customer']}),
        ('Artisan', {'fields': ['artisan']}),
        ('Product', {'fields': ['product']}),
        ('Chat', {'fields': ['title', 'status', 'description', 'reference_image', 'budget']}),
    ]


class ChatMessageAdmin(admin.ModelAdmin):
    search_fields= ['message']
    list_filter=['sender_type', 'type']
    list_display= ['chat', 'message', 'sender', 'type']
    
    fieldsets= [
        ('Chat', {'fields': ['chat']}),
        ('Sender', {'fields': ['sender']}),
        ('Message', {'fields': ['message', 'type']}),
    ]

admin.site.register(Chat, ChatAdmin)
admin.site.register(ChatMessage, ChatMessageAdmin)