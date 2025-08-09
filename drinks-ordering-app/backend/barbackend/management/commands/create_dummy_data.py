# your_app/management/commands/create_dummy_data.py

from django.core.management.base import BaseCommand
from decimal import Decimal
import random

from barbackend.models import User, Drink, Cart, CartItem, Order, OrderItem 

class Command(BaseCommand):
    help = 'Create dummy data for the bar ordering app'

    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old data...")
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        CartItem.objects.all().delete()
        Cart.objects.all().delete()
        Drink.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write("Creating users...")
        users = [
            User(username='alice', email='alice@example.com', password_hash='hashed_pw1', role='customer'),
            User(username='bob', email='bob@example.com', password_hash='hashed_pw2', role='customer'),
            User(username='carol', email='carol@example.com', password_hash='hashed_pw3', role='staff'),
        ]
        User.objects.bulk_create(users)

        users = list(User.objects.all())

        self.stdout.write("Creating drinks...")
        drinks = [
            Drink(name='Coca-Cola', description='Classic Coke', price=Decimal('1.50'), available=True),
            Drink(name='Orange Juice', description='Freshly squeezed', price=Decimal('2.00'), available=True),
            Drink(name='Beer', description='Local craft beer', price=Decimal('3.50'), available=True),
            Drink(name='Water', description='Still water', price=Decimal('1.00'), available=True),
        ]
        Drink.objects.bulk_create(drinks)
        drinks = list(Drink.objects.all())

        self.stdout.write("Creating carts and cart items...")
        for user in users:
            if user.role == 'customer':
                cart = Cart.objects.create(user=user)
                for drink in random.sample(drinks, random.randint(1, 3)):
                    CartItem.objects.create(cart=cart, drink=drink, quantity=random.randint(1, 5))

        self.stdout.write("Creating orders and order items...")
        for user in users:
            if user.role == 'customer':
                for _ in range(random.randint(1, 2)):
                    order = Order.objects.create(
                        user=user,
                        status=random.choice(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
                        total_price=Decimal('0.00'),
                    )
                    total = Decimal('0.00')
                    for drink in random.sample(drinks, random.randint(1, 3)):
                        qty = random.randint(1, 4)
                        OrderItem.objects.create(order=order, drink=drink, quantity=qty)
                        total += drink.price * qty
                    order.total_price = total
                    order.save()

        self.stdout.write(self.style.SUCCESS('Dummy data created successfully!'))
