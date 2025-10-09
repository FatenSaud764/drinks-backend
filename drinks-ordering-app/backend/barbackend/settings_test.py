"""
Test settings for Django CI runs.
Overrides storage to local filesystem to avoid external Supabase during tests.
"""

import os
os.environ.setdefault("USE_LOCAL_FILE_STORAGE", "1")
from .settings import *  # noqa

# Use local file storage for tests to avoid network and credentials
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# Ensure debug-friendly defaults
DEBUG = True

# Force Drink.image to use FileSystemStorage instead of Supabase during tests
try:
	from django.core.files.storage import FileSystemStorage
	from barbackend.models import Drink
	Drink._meta.get_field("image").storage = FileSystemStorage()
except Exception:
	# If models not ready yet, tests may still import after apps load; safe to ignore
	pass
