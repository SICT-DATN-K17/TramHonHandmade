from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'
    
    def ready(self):
        # Nạp file signals khi app users khởi động
        import users.signals
