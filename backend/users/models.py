from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, name, email, password=None, **extra_fields):
        if not name:
            raise ValueError('Trường Name là bắt buộc')
        if not email:
            raise ValueError('Trường Email là bắt buộc')
        extra_fields.setdefault('role', 'CUSTOMER')
        email = self.normalize_email(email)
        user = self.model(name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, name, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser phải có is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser phải có is_superuser=True.')
        
        return self.create_user(name, email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('USER', 'Customer'),
        ('ARTISAN', 'Artisan'),
        ('ADMIN', 'Admin'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)

    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name'] 
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.name
    
    @property
    def is_artisan(self):
        return self.role == 'ARTISAN'
    
    @property
    def is_customer(self):
        return self.role == 'CUSTOMER'

    @property
    def is_system_admin(self):
        return self.role == 'ADMIN' or self.is_superuser


class Otp(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    password = models.CharField(max_length=255, null=True, blank=True)
    code = models.CharField(max_length=255, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'otps'
        verbose_name = 'OTP'
        verbose_name_plural = 'OTPs'

    def __str__(self):
        return f"OTP for {self.email or 'unknown'}"
