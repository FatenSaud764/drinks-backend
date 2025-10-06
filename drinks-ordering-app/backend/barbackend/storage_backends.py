"""
Custom storage backend for Supabase Storage
"""
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from supabase import create_client, Client
from decouple import config
import os
from urllib.parse import urljoin


class SupabaseStorage(Storage):
    """
    Custom storage backend for Supabase Storage
    """
    
    def __init__(self):
        self.supabase_url = config("SUPABASE_URL")
        self.supabase_key = config("SUPABASE_KEY")
        self.bucket_name = config("SUPABASE_BUCKET_NAME", default="drink-images")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
    def _get_file_url(self, name):
        """Get the public URL for a file"""
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{name}"
    
    def _save(self, name, content):
        """Save file to Supabase Storage"""
        try:
            # Read the file content
            file_content = content.read()
            
            # Get the content type
            content_type = getattr(content, 'content_type', 'application/octet-stream')
            
            # Upload to Supabase
            self.supabase.storage.from_(self.bucket_name).upload(
                path=name,
                file=file_content,
                file_options={"content-type": content_type}
            )
            
            return name
        except Exception as e:
            # If file exists, try updating it
            try:
                self.supabase.storage.from_(self.bucket_name).update(
                    path=name,
                    file=file_content,
                    file_options={"content-type": content_type}
                )
                return name
            except Exception as update_error:
                raise Exception(f"Failed to save file: {str(e)}, Update error: {str(update_error)}")
    
    def _open(self, name, mode='rb'):
        """Open file from Supabase Storage"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).download(name)
            return ContentFile(response)
        except Exception as e:
            raise Exception(f"Failed to open file: {str(e)}")
    
    def delete(self, name):
        """Delete file from Supabase Storage"""
        try:
            self.supabase.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            print(f"Failed to delete file {name}: {str(e)}")
    
    def exists(self, name):
        """Check if file exists in Supabase Storage"""
        try:
            files = self.supabase.storage.from_(self.bucket_name).list()
            return any(file['name'] == name for file in files)
        except:
            return False
    
    def url(self, name):
        """Return the public URL for the file"""
        return self._get_file_url(name)
    
    def size(self, name):
        """Return the size of the file"""
        try:
            files = self.supabase.storage.from_(self.bucket_name).list()
            for file in files:
                if file['name'] == name:
                    return file.get('metadata', {}).get('size', 0)
            return 0
        except:
            return 0