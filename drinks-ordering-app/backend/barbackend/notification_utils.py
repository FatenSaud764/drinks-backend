"""
Utility functions for sending WebSocket notifications.
Create this file in your barbackend directory.
"""

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import datetime

def send_new_order_notification(order):
    """
    Send a new order notification to all connected admin clients.
    
    Args:
        order: Order model instance
    """
    try:
        channel_layer = get_channel_layer()
        
        if channel_layer is None:
            print("ERROR: Channel layer is None - check CHANNEL_LAYERS in settings.py")
            return
        
        # Prepare order data
        order_data = {
            'id': order.id,
            'orderNumber': f"#{order.id}",
            'status': order.status,
            'note': order.note,
            'total': str(order.total_price),  # Fixed: was order.total
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'user': {
                'id': order.user.id,
                'username': order.user.username,
            } if order.user else None,
        }
        
        print(f"Sending new order notification for order #{order.id} to admin_notifications group")
        
        # Send to all connected admin clients
        async_to_sync(channel_layer.group_send)(
            'admin_notifications',
            {
                'type': 'new_order',
                'order': order_data,
                'timestamp': datetime.now().isoformat()
            }
        )
        
        print(f"Successfully sent notification for order #{order.id}")
        
    except Exception as e:
        print(f"ERROR sending WebSocket notification: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

def send_order_update_notification(order, old_status=None):
    """
    Send an order status update notification to all connected admin clients.
    
    Args:
        order: Order model instance
        old_status: Previous status (optional)
    """
    channel_layer = get_channel_layer()
    
    # Prepare order data
    order_data = {
        'id': order.id,
        'orderNumber': f"#{order.id}",
        'status': order.status,
        'note': order.note,
        'total': str(order.total_price),
        'created_at': order.created_at.isoformat() if order.created_at else None,
    }
    
    # Send to all connected admin clients
    async_to_sync(channel_layer.group_send)(
        'admin_notifications',
        {
            'type': 'order_update',
            'order_id': order.id,
            'status': order.status,
            'old_status': old_status,
            'order': order_data,
            'timestamp': datetime.now().isoformat()
        }
    )