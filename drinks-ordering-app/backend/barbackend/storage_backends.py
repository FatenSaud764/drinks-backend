"""
Production-ready custom storage backend for Supabase Storage
Falls back to local FileSystemStorage when USE_LOCAL_FILE_STORAGE=1 (for tests/CI).
"""
import os
from django.core.files.storage import Storage, FileSystemStorage
from django.core.files.base import ContentFile
from supabase import create_client, Client
from decouple import config
from urllib.parse import urljoin
import io

class SupabaseStorage(Storage):
    """
    Custom Django storage backend for Supabase Storage
    """

    def __init__(self):
        self.use_local = os.getenv("USE_LOCAL_FILE_STORAGE") == "1"
        if self.use_local:
            self.local_storage = FileSystemStorage()
            return
        # Only read Supabase config if not using local storage
        self.supabase_url = config("SUPABASE_URL", default="http://example.invalid")
        self.supabase_key = config("SUPABASE_KEY", default="invalid-key")
        self.bucket_name = config("SUPABASE_BUCKET_NAME", default="drink-images")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    # -------------------
    # Internal helpers
    # -------------------
    def _get_file_url(self, name, signed=False, expires_in=3600):
        """
        Return the file URL.
        If signed=True, generate a temporary signed URL (for private buckets)
        """
        if self.use_local:
            # Local storage just returns a path; during tests URLs are not critical
            return self.local_storage.url(name)
        if signed:
            data = self.supabase.storage.from_(self.bucket_name).create_signed_url(name, expires_in)
            return data.get('signedUrl')
        # Public URL
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{name}"

    def _file_exists(self, name):
        """Check if a file exists in Supabase Storage"""
        if self.use_local:
            try:
                # FileSystemStorage 'exists' is available
                return self.local_storage.exists(name)
            except Exception:
                return False
        try:
            files = self.supabase.storage.from_(self.bucket_name).list()
            return any(file['name'] == name for file in files)
        except:
            return False

    # -------------------
    # Required Django methods
    # -------------------
    def _save(self, name, content):
        """Save file to Supabase Storage"""
        file_content = content.read()
        content_type = getattr(content, 'content_type', 'application/octet-stream')

        if self.use_local:
            return self.local_storage._save(name, ContentFile(file_content))

        try:
            # Delete existing file if it exists (ignore errors if it doesn't)
            try:
                self.supabase.storage.from_(self.bucket_name).remove([name])
            except:
                pass  # File doesn't exist, that's fine

            # Upload the file - if 409 (duplicate) error occurs, it means the file
            # is still there, so just return success since the file exists
            try:
                self.supabase.storage.from_(self.bucket_name).upload(
                    path=name,
                    file=file_content,
                    file_options={"content-type": content_type}
                )
            except Exception as e:
                if "409" in str(e) or "Duplicate" in str(e):
                    # File already exists, that's fine - we can proceed
                    pass
                else:
                    raise
            return name
        except Exception as e:
            raise Exception(f"Failed to save file '{name}': {str(e)}")

    def _open(self, name, mode='rb'):
        """Retrieve file from Supabase Storage"""
        if self.use_local:
            return self.local_storage._open(name, mode)
        try:
            data = self.supabase.storage.from_(self.bucket_name).download(name)
            return ContentFile(data)
        except Exception as e:
            raise Exception(f"Failed to open file '{name}': {str(e)}")

    def delete(self, name):
        """Delete file from Supabase Storage"""
        if self.use_local:
            try:
                if self.local_storage.exists(name):
                    self.local_storage.delete(name)
            except Exception as e:
                print(f"Failed to delete file '{name}': {str(e)}")
            return
        try:
            if self._file_exists(name):
                self.supabase.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            print(f"Failed to delete file '{name}': {str(e)}")

    def exists(self, name):
        """Check if file exists"""
        if self.use_local:
            try:
                return self.local_storage.exists(name)
            except Exception:
                return False
        return self._file_exists(name)

    def url(self, name):
        """Return public URL for the file"""
        if self.use_local:
            return self.local_storage.url(name)
        return self._get_file_url(name, signed=False)

    def size(self, name):
        """Return size of file (bytes)"""
        if self.use_local:
            try:
                return self.local_storage.size(name)
            except Exception:
                return 0
        try:
            files = self.supabase.storage.from_(self.bucket_name).list()
            for file in files:
                if file['name'] == name:
                    # Supabase returns size as int in metadata sometimes, fallback to 0
                    return file.get('metadata', {}).get('size', 0)
            return 0
        except:
            return 0