from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.models import BaseUserManager
from .models import *

class DrinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drink
        fields = '__all__'
        image = serializers.ImageField(use_url=True)


    def update(self, instance, validated_data):
        if 'available' in validated_data and 'stock' not in validated_data:
            instance._manual_availability = True
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    drink_id = serializers.PrimaryKeyRelatedField(
        queryset=Drink.objects.all(), source='drink'
    )
    # ADD: Include drink details to avoid extra queries when viewing orders
    drink = DrinkSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'drink_id', 'drink', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    class Meta:
        model = Order
        fields = ['id', 'user', 'note', 'status', 'total_price', 'items', 'created_at', 'updated_at']
        read_only_fields = ['status', 'total_price', 'created_at', 'updated_at']

    def create(self, validated_data):
        from decimal import Decimal
        items_data = validated_data.pop('items', [])
        
        # OPTIMIZATION: Collect all drink IDs and fetch in one query
        drink_ids = [item_data['drink'].id for item_data in items_data]
        drinks = {d.id: d for d in Drink.objects.filter(id__in=drink_ids)}
        
        total = Decimal('0.00')
        for item_data in items_data:
            drink = drinks[item_data['drink'].id]
            total += drink.price * item_data['quantity']
        
        order = Order.objects.create(total_price=total, **validated_data)
        
        # OPTIMIZATION: Use bulk_create instead of individual creates
        order_items = [
            OrderItem(order=order, drink=item_data['drink'], quantity=item_data['quantity'])
            for item_data in items_data
        ]
        OrderItem.objects.bulk_create(order_items)
        
        return order


class CartItemSerializer(serializers.ModelSerializer):
    drink_id = serializers.PrimaryKeyRelatedField(
        queryset=Drink.objects.all(), source='drink'
    )
    # ADD: Include full drink details
    drink = DrinkSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'drink_id', 'drink', 'quantity', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'note', 'items', 'total_price', 'created_at']

    def get_total_price(self, obj: Cart):
        """FIXED: Use prefetched data instead of triggering new query"""
        from decimal import Decimal
        total = Decimal('0.00')
        
        # Access items through the prefetched data (no new query)
        # The view MUST prefetch items with drinks for this to work
        for item in obj.items.all():
            total += item.drink.price * item.quantity
        return str(total)

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        cart = Cart.objects.create(**validated_data)
        
        # OPTIMIZATION: Use bulk_create
        cart_items = [
            CartItem(cart=cart, drink=item_data['drink'], quantity=item_data['quantity'])
            for item_data in items_data
        ]
        CartItem.objects.bulk_create(cart_items)
        return cart

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.note = validated_data.get('note', instance.note)
        instance.save()

        # OPTIMIZATION: Batch operations
        existing_items = {item.drink_id: item for item in instance.items.all()}
        items_to_create = []
        items_to_update = []
        items_to_delete = []

        for item_data in items_data:
            drink = item_data['drink']
            quantity = item_data['quantity']
            
            if drink.id in existing_items:
                item = existing_items[drink.id]
                if quantity <= 0:
                    items_to_delete.append(item.id)
                else:
                    item.quantity = quantity
                    items_to_update.append(item)
            elif quantity > 0:
                items_to_create.append(
                    CartItem(cart=instance, drink=drink, quantity=quantity)
                )

        # Execute batch operations
        if items_to_delete:
            CartItem.objects.filter(id__in=items_to_delete).delete()
        if items_to_update:
            CartItem.objects.bulk_update(items_to_update, ['quantity'])
        if items_to_create:
            CartItem.objects.bulk_create(items_to_create)

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
        fields = ['id', 'username', 'email', 'role', 'is_staff', 'is_admin', 'date_joined', 'created_at', 'password']
        read_only_fields = ['id', 'is_staff', 'is_admin', 'date_joined', 'created_at']
        extra_kwargs = {
            'role': {'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})

        if 'email' in validated_data and validated_data['email']:
            validated_data['email'] = BaseUserManager.normalize_email(validated_data['email'])

        request = self.context.get('request')
        is_staff = bool(getattr(getattr(request, 'user', None), 'is_staff', False))
        if not is_staff:
            validated_data['role'] = 'customer'
        elif 'role' not in validated_data:
            validated_data['role'] = 'customer'

        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        request = self.context.get('request')
        is_staff = bool(getattr(getattr(request, 'user', None), 'is_staff', False))
        if not is_staff and 'role' in validated_data:
            validated_data.pop('role', None)

        if 'email' in validated_data and validated_data['email']:
            validated_data['email'] = BaseUserManager.normalize_email(validated_data['email'])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
