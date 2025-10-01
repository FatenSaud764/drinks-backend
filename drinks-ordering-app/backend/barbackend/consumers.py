import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept the connection
        await self.accept()
        
        # Join the admin_notifications group
        await self.channel_layer.group_add(
            'admin_notifications',
            self.channel_name
        )
        
        print(f"WebSocket connected: {self.channel_name} joined admin_notifications")
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notification service'
        }))

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            'admin_notifications',
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        """Handle messages from WebSocket (if needed)"""
        data = json.loads(text_data)
        print(f"Received from client: {data}")

    # Handler for new_order messages sent from group
    async def new_order(self, event):
        """Send new order notification to WebSocket."""
        print(f"Sending new_order to client: {event}")
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order': event['order'],
            'timestamp': event['timestamp']
        }))

    # Handler for order_update messages
    async def order_update(self, event):
        """Send order update notification to WebSocket."""
        print(f"Sending order_update to client: {event}")
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order_id': event['order_id'],
            'status': event['status'],
            'old_status': event.get('old_status'),
            'order': event['order'],
            'timestamp': event['timestamp']
        }))