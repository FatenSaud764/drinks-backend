import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.is_staff = False
        self.user_id = None
        self.group_name = None

    async def connect(self):
        # Accept the connection
        await self.accept()
        print(f"WebSocket connected: {self.channel_name}")
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notification service. Please authenticate.'
        }))

    async def disconnect(self, close_code):
        # Leave the group if joined
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            print(f"WebSocket disconnected: {self.channel_name} left {self.group_name}")

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'authenticate':
                await self.handle_authentication(data)
            else:
                print(f"Received unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            print(f"Failed to parse message: {text_data}")

    async def handle_authentication(self, data):
        """Handle authentication and group assignment"""
        self.is_staff = data.get('isStaff', False)
        self.user_id = data.get('userId')
        
        # Determine which group to join
        if self.is_staff:
            self.group_name = 'staff_notifications'
        elif self.user_id:
            self.group_name = f'user_{self.user_id}_notifications'
        else:
            self.group_name = 'client_notifications'
        
        # Join the appropriate group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        print(f"Authenticated: {self.channel_name} joined {self.group_name}")
        
        # Send authentication confirmation
        await self.send(text_data=json.dumps({
            'type': 'authenticated',
            'isStaff': self.is_staff,
            'userId': self.user_id,
            'group': self.group_name
        }))

    # Handler for new_order messages sent from group
    async def new_order(self, event):
        """Send new order notification to WebSocket."""
        print(f"Sending new_order to {self.group_name}: order #{event['order']['id']}")
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order': event['order'],
            'timestamp': event['timestamp']
        }))

    # Handler for order_update messages
    async def order_update(self, event):
        """Send order update notification to WebSocket."""
        print(f"Sending order_update to {self.group_name}: order #{event['order_id']}")
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order_id': event['order_id'],
            'status': event['status'],
            'old_status': event.get('old_status'),
            'order': event['order'],
            'timestamp': event['timestamp']
        }))