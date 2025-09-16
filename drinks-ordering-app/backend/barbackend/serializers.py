from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.models import BaseUserManager
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
        from decimal import Decimal
        items_data = validated_data.pop('items', [])
        # Compute total before creating order to satisfy NOT NULL constraint
        total = Decimal('0.00')
        for item_data in items_data:
            drink = item_data['drink']
            quantity = item_data['quantity']
            total += drink.price * quantity
        order = Order.objects.create(total_price=total, **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, drink=item_data['drink'], quantity=item_data['quantity'])
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
                if item_data['quantity'] <= 0:
                    # Delete item if quantity is 0 or less
                    item.delete()
                else:
                    # Update quantity if greater than 0
                    item.quantity = item_data['quantity']
                    item.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        max_length=50,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This username is already taken.")],
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email is already registered.")],
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, min_length=6)
    is_staff = serializers.BooleanField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    class Meta:
        model = User
        # Expose safe fields for "user info" and accept password for signup
        fields = ['id', 'username', 'email', 'role', 'is_staff', 'is_admin', 'date_joined', 'created_at', 'password']
        read_only_fields = ['id', 'is_staff', 'is_admin', 'date_joined', 'created_at']
        extra_kwargs = {
            'role': {'required': False},
        }

    def create(self, validated_data):
        # Require password for signup
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})

        # Normalize email
        if 'email' in validated_data and validated_data['email']:
            validated_data['email'] = BaseUserManager.normalize_email(validated_data['email'])

        # Default role to customer for non-staff callers
        request = self.context.get('request')
        is_staff = bool(getattr(getattr(request, 'user', None), 'is_staff', False))
        if not is_staff:
            validated_data['role'] = 'customer'
        elif 'role' not in validated_data:
            validated_data['role'] = 'customer'

        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        # Disallow role changes by non-staff
        request = self.context.get('request')
        is_staff = bool(getattr(getattr(request, 'user', None), 'is_staff', False))
        if not is_staff and 'role' in validated_data:
            validated_data.pop('role', None)

        # Normalize email if present
        if 'email' in validated_data and validated_data['email']:
            validated_data['email'] = BaseUserManager.normalize_email(validated_data['email'])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance