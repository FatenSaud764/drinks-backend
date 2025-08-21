from django.test import TestCase
from decimal import Decimal
from barbackend.models import User, Drink, Cart, CartItem, Order, OrderItem

class UserModelTest(TestCase):
    def test_user_creation(self):
        user = User.objects.create(username='alice', email='alice@example.com', password_hash='pw', role='customer')
        self.assertEqual(user.username, 'alice')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(User.objects.filter(email='alice@example.com').exists())

class DrinkModelTest(TestCase):
    def test_drink_creation(self):
        drink = Drink.objects.create(name='Coca-Cola', description='Classic Coke', price=Decimal('1.50'), available=True)
        self.assertEqual(drink.name, 'Coca-Cola')
        self.assertTrue(drink.available)
        self.assertEqual(Drink.objects.count(), 1)

class CartAndCartItemTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='bob', email='bob@example.com', password_hash='pw', role='customer')
        self.drink = Drink.objects.create(name='Beer', description='Craft beer', price=Decimal('3.50'), available=True)

    def test_cart_and_item(self):
        cart = Cart.objects.create(user=self.user)
        item = CartItem.objects.create(cart=cart, drink=self.drink, quantity=2)
        self.assertEqual(cart.user.username, 'bob')
        self.assertEqual(item.quantity, 2)
        self.assertEqual(CartItem.objects.count(), 1)

class OrderAndOrderItemTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='carol', email='carol@example.com', password_hash='pw', role='customer')
        self.drink1 = Drink.objects.create(name='Water', description='Still water', price=Decimal('1.00'), available=True)
        self.drink2 = Drink.objects.create(name='Orange Juice', description='Freshly squeezed', price=Decimal('2.00'), available=True)

    def test_order_and_items(self):
        order = Order.objects.create(user=self.user, status='pending', total_price=Decimal('0.00'))
        item1 = OrderItem.objects.create(order=order, drink=self.drink1, quantity=3)
        item2 = OrderItem.objects.create(order=order, drink=self.drink2, quantity=2)
        total = self.drink1.price * 3 + self.drink2.price * 2
        order.total_price = total
        order.save()
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 2)
        self.assertEqual(Order.objects.first().total_price, total)
