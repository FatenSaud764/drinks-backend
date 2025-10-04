from django.db import connection

class CloseConnectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        finally:
            # Always close after request to avoid pool exhaustion
            connection.close()
        return response