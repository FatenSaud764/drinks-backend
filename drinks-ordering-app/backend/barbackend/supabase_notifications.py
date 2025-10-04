import requests
from django.conf import settings
from datetime import datetime

SUPABASE_URL = "https://lrbmdxrikfwrxgsawgwi.supabase.co"
SUPABASE_ANON_KEY = settings.config.get("SUPABASE_ANON_KEY", "")  # Add to your .env

def send_new_order_notification(order):
    """Send notification via Supabase REST API"""
    try:
        payload = {
            'type': 'new_order',
            'order_id': order.id,
            'order_number': f"#{order.id}",
            'status': order.status,
            'note': order.note,
            'total': str(order.total_price),
            'user_id': order.user.id,
            'username': order.user.username,
            'created_at': order.created_at.isoformat() if order.created_at else datetime.now().isoformat(),
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/notifications",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json=payload,
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"✓ Notification sent for order #{order.id}")
        else:
            print(f"✗ Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"ERROR sending notification: {e}")

def send_order_update_notification(order, old_status=None):
    """Send order update notification"""
    try:
        payload = {
            'type': 'order_update',
            'order_id': order.id,
            'order_number': f"#{order.id}",
            'status': order.status,
            'old_status': old_status,
            'note': order.note,
            'total': str(order.total_price),
            'user_id': order.user.id,
            'created_at': datetime.now().isoformat(),
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/notifications",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json=payload,
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"✓ Update notification sent for order #{order.id}")
            
    except Exception as e:
        print(f"ERROR sending update notification: {e}")