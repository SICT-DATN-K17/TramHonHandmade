from .views import *
from django.urls import path

urlpatterns = [
    path('register/', RegisterView.as_view(), name='custom-register'),
    path('verify-account/', VerifyAccountView.as_view(), name='custom-verify-account'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]
