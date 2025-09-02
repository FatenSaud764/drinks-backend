import secrets
from django.conf import settings
from .models import OrderOTP


def generate_numeric_code(length: int | None = None) -> str:
    """Generate a numeric OTP code that is unique among active (not used) OTPs.

    - Uses cryptographically secure randomness.
    - Ensures no collision with OrderOTP entries where is_used=False.
    """
    length = length or getattr(settings, 'OTP_CODE_LENGTH', 6)

    def _random_code(n: int) -> str:
        digits = '0123456789'
        return ''.join(secrets.choice(digits) for _ in range(n))

    n = length
    while True:
        code = _random_code(n)
        # Check uniqueness among active OTPs only
        if not OrderOTP.objects.filter(is_used=False, code_plain=code).exists():
            return code
