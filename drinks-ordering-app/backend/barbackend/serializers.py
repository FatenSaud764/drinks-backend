from rest_framework import serializers
from .models import *

class DrinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drink
        fields = '__all__'

    # Added by @kirsten - to handle manual availability toggling if stock drops below threshold (5 units)
    def update(self, instance, validated_data):
        # Check if this is a manual availability toggle
        if 'available' in validated_data and 'stock' not in validated_data:
            instance._manual_availability = True
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    drink_id = serializers.PrimaryKeyRelatedField(
        queryset=Drink.objects.all(), source='drink'
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'drink_id', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'note', 'status', 'total_price', 'items', 'created_at', 'updated_at']
        read_only_fields = ['status', 'total_price', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            drink = item_data['drink']
            quantity = item_data['quantity']
            OrderItem.objects.create(order=order, drink=drink, quantity=quantity)
            total += drink.price * quantity
        order.total_price = total
        order.save()
        return order

class CartItemSerializer(serializers.ModelSerializer):
    drink_id = serializers.PrimaryKeyRelatedField(
        queryset=Drink.objects.all(), source='drink'
    )

    class Meta:
        model = CartItem
        fields = ['id', 'drink_id', 'quantity', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'note', 'items', 'total_price', 'created_at']

    def get_total_price(self, obj: Cart):
        # Calculate using current drink prices to reflect updates
        from decimal import Decimal
        total = Decimal('0.00')
        for item in obj.items.select_related('drink').all():
            total += item.drink.price * item.quantity
        return str(total)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        cart = Cart.objects.create(**validated_data)
        for item_data in items_data:
            CartItem.objects.create(cart=cart, **item_data)
        return cart

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        # Update cart note if present
        instance.note = validated_data.get('note', instance.note)
        instance.save()

        # Update/create CartItems
        for item_data in items_data:
            item, created = CartItem.objects.get_or_create(
                cart=instance,
                drink=item_data['drink'],
                defaults={'quantity': item_data['quantity']}
            )
            if not created:
                item.quantity = item_data['quantity']
                item.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password_hash', 'created_at']