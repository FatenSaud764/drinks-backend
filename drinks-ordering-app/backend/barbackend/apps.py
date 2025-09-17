from django.apps import AppConfig


class BarbackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'barbackend'

    def ready(self):
        # Import signal handlers
        from . import signals  # noqa: F401

        # added by Kirsten Sanders
        # Ensure default staff user exists for fallback authentication
        self.ensure_default_staff()
    
    def ensure_default_staff(self):
        """Create default staff user if none exists"""
        try:
            from django.db import transaction
            from .models import User
            
            with transaction.atomic():
                if not User.objects.filter(role='staff').exists():
                    User.objects.create_user(
                        username='default_staff',
                        email='staff@example.com',
                        password='defaultpassword123',
                        role='staff',
                        is_staff=True,
                        is_admin=False
                    )
                    print("Created default staff user for fallback authentication")
        except Exception as e:
            # Silently fail during migrations or if database isn't ready
            pass
        # end added by Kirsten Sanders
