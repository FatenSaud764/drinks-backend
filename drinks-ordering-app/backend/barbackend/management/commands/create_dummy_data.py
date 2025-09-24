from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.conf import settings
from decimal import Decimal
import random
import itertools
import os

from barbackend.models import (
    User,
    Drink,
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderOTP,
)


class Command(BaseCommand):
    help = 'Create deterministic dummy data for the bar ordering app (users, drinks, carts, orders, OTPs)'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write("Clearing old data...")
        # Order of deletion to satisfy FK constraints
        OrderOTP.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        CartItem.objects.all().delete()
        Cart.objects.all().delete()
        Drink.objects.all().delete()
        User.objects.all().delete()

        # Seed control for repeatability
        random.seed(42)

        # --- Users ---
        self.stdout.write("Creating users (customers + staff)...")

        # Create default staff FIRST to ensure User.objects.first() returns a staff member
        # Added by Kirsten Sanders
        default_staff = User.objects.create_user(
            username='default_staff',
            email='staff@example.com', 
            password='defaultpassword123',
            role='staff'
        )
        default_staff.is_staff = True
        default_staff.save(update_fields=["is_staff"])
        print(default_staff.username, default_staff.role, default_staff.is_staff)
        # End added by Kirsten Sanders

        customer_defs = [
            ("alice", "alice@example.com", "alice123"),
            ("bob", "bob@example.com", "bob123"),
            ("carol", "carol@example.com", "carol123"),
        ]
        staff_defs = [
            ("admin", "admin@example.com", "admin123"),  # designated admin staff
            ("dave", "dave@example.com", "dave123"),
            ("eve", "eve@example.com", "eve123"),
        ]

        users = [default_staff]  # Start with default staff - added by Kirsten Sanders

        # Create users via manager to ensure proper password hashing
        # users = [] # removed by Kirsten Sanders
        for uname, email, pwd in customer_defs:
            users.append(User.objects.create_user(username=uname, email=email, password=pwd, role='customer'))
        for uname, email, pwd in staff_defs:
            u = User.objects.create_user(username=uname, email=email, password=pwd, role='staff')
            if uname == 'admin':
                u.is_staff = True
                u.is_admin = True
                u.is_superuser = True
                u.save(update_fields=["is_staff", "is_admin", "is_superuser"])
            users.append(u)
        users = list(User.objects.order_by('id'))
        customers = [u for u in users if u.role == 'customer']

        # --- Drinks ---
        self.stdout.write("Creating drinks with images from media/assets ...")
        # Map friendly drink names to actual files in media/assets
        drink_defs = [
            # Water
            ("Still Water", "StillWater.jpg", Decimal('18.00'), "water", 200),
            ("Tap Water", "TapWater.jpg", Decimal('0.00'), "water", 200),
            # Non-alcoholic
            ("Coco Cola", "CocoCola.jpg", Decimal('28.00'), "non-alcoholic", 30),
            ("Orange Juice", "OrangeJuice.jpg", Decimal('25.00'), "non-alcoholic", 30),
            # Cocktails
            ("Espresso Martini", "EspressoMartini.jpg", Decimal('95.00'), "cocktail", 50),
            ("Gin & Tonic", "GinTonic.jpg", Decimal('90.00'), "cocktail", 40),
            ("Mimosa", "Mimosa.png", Decimal('80.00'), "cocktail", 45),
            ("Passionfruit Martini", "PassionMartini.png", Decimal('90.50'), "cocktail", 30),
            ("Peach Vodka", "PeachVodka.jpg", Decimal('72.00'), "cocktail", 25),
            ("Tequila Shot", "TequilaSour.png", Decimal('35.00'), "cocktail", 60),
            ("Pina Colada", "PinaColada.jpg", Decimal('85.00'), "cocktail", 20),
            # Mocktails
            ("Sunrise Mocktail", "SunriseMocktail.jpg", Decimal('60.00'), "mocktail", 30),
            # Beers            
            ("Irish Ale", "IrishAle.jpg", Decimal('49.00'), "beer", 80),
            ("Black Label Beer", "BlackLabelBeer.jpg", Decimal('45.00'), "beer", 20),
            ("Heineken", "HeinekenBeer.jpg", Decimal('42.00'), "beer", 35),
            # Wines
            ("Red Wine", "RedWine.jpg", Decimal('120.00'), "wine", 40),
            ("White Wine", "WhiteWine.jpg", Decimal('110.00'), "wine", 40),
            # Shots
            ("Jagermeister", "Jagermeister.jpg", Decimal('50.00'), "shot", 70),
            ("Whiskey Shot", "WhiskeyShot.jpg", Decimal('55.00'), "shot", 65),
            ]

        def resolve_image(filename: str) -> str:
            # Ensure the file exists under MEDIA_ROOT/assets; otherwise fallback to a generic cocktail image
            candidate = os.path.join(settings.MEDIA_ROOT, 'assets', filename)
            if os.path.exists(candidate):
                return f'assets/{filename}'
            # fallback options present in repo
            for fallback in [filename, 'cocktail.png', 'water.jpg']:
                fb_path = os.path.join(settings.MEDIA_ROOT, 'assets', fallback)
                if os.path.exists(fb_path):
                    return f'assets/{fallback}'
            # last resort: keep original name
            return f'assets/{filename}'

        drinks = []
        for name, filename, price, category, stock in drink_defs:
            image_path = resolve_image(filename)
            drinks.append(
                Drink(
                    name=name,
                    description=f"Delicious {name}",
                    image=image_path,
                    price=price,
                    category=category,
                    available=True,
                    stock=stock,
                )
            )
        Drink.objects.bulk_create(drinks)
        drinks = list(Drink.objects.order_by('id'))

        # --- Carts ---
        self.stdout.write("Creating a cart for every user with a few items...")
        for user in users:
            cart = Cart.objects.create(user=user, note=f"Cart for {user.username}")
            # Add 2-3 unique drinks per cart
            for drink in random.sample(drinks, k=3 if len(drinks) >= 3 else len(drinks)):
                qty = random.randint(1, 3)
                CartItem.objects.create(cart=cart, drink=drink, quantity=qty)

        # --- Orders & OTPs ---
        # 3 orders per each status, evenly divided among customers; store OTP in order note
        status_cycle = [s for s, _ in Order.STATUS_CHOICES]
        target_per_status = 3
        total_orders = target_per_status * len(status_cycle)

        self.stdout.write(
            f"Creating {target_per_status} orders for each status ({total_orders} total) and generating OTPs..."
        )
        orders_created = []
        user_cycle = itertools.cycle(customers)  # 15 orders / 3 customers = 5 each
        otp_counter = 123450  # deterministic starting point for OTPs

        for status in status_cycle:
            for _ in range(target_per_status):
                user = next(user_cycle)
                order = Order.objects.create(
                    user=user,
                    status=status,
                    note="",
                    total_price=Decimal('0.00'),
                )

                # Add 1-3 items per order
                num_items = random.randint(1, 3)
                chosen = random.sample(drinks, num_items)
                total = Decimal('0.00')
                for drink in chosen:
                    qty = random.randint(1, 4)
                    OrderItem.objects.create(order=order, drink=drink, quantity=qty)
                    total += drink.price * qty

                # OTP: store hashed in OrderOTP and the plain code in order.note for testing
                otp_code = f"{otp_counter % 1000000:06d}"
                otp_counter += 1
                OrderOTP.objects.create(order=order, code_hash=make_password(otp_code), code_plain=otp_code)
                order.total_price = total
                order.note = f"Test OTP: {otp_code}"
                order.save(update_fields=["total_price", "note", "updated_at"])
                orders_created.append(order)

        self.stdout.write(self.style.SUCCESS(
            f"Dummy data created: {len(users)} users, {len(drinks)} drinks, {len(users)} carts, {len(orders_created)} orders with OTPs."
        ))
