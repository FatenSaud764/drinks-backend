"""
WebSocket consumers for real-time notifications.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for order notifications.
    Handles connections from admin users to receive real-time order updates.
    """
    
    async def connect(self):
        """Handle WebSocket connection."""
        # Group name for all admin notifications
        self.group_name = 'admin_notifications'
        
        # Join the admin notifications group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notification service'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        # Leave the group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to keepalive ping
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
            elif message_type == 'authenticate':
                # Handle authentication if needed
                pass
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
    
    # Handler for new_order messages sent from group
    async def new_order(self, event):
        """Send new order notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order': event['order'],
            'timestamp': event['timestamp']
        }))
    
    # Handler for order_update messages sent from group
    async def order_update(self, event):
        """Send order update notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'orderId': event['order_id'],
            'status': event['status'],
            'order': event.get('order'),
            'timestamp': event['timestamp']
        }))