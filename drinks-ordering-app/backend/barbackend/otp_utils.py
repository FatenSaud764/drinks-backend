import random
from django.conf import settings


def generate_numeric_code(length: int | None = None) -> str:
    length = length or getattr(settings, 'OTP_CODE_LENGTH', 6)
    return ''.join(str(random.randint(0, 9)) for _ in range(length))
