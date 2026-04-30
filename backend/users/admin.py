from django.contrib import admin
from .models import *

# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display= ['name', 'role', 'email']
    list_filter= ['role']
    search_fields= ['name', 'email']
    
    fieldsets= [
        ('User', {'fields': ['name', 'email', 'role', 'password', 'is_staff', 'is_active', ]})
    ]


class OtpAdmin(admin.ModelAdmin):
    list_display= ['name', 'email']
    list_filter= ['email']


class AddressAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone_number', 'user']
    search_fields = ['full_name', 'phone_number', 'user__email']


admin.site.register(CustomUser, UserAdmin)
admin.site.register(Otp, OtpAdmin)
admin.site.register(Address, AddressAdmin)