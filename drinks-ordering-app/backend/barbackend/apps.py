from django.apps import AppConfig


class BarbackendConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'barbackend'

    def ready(self):
        # Import signal handlers
        from . import signals  # noqa: F401
