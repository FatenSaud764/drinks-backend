from django.test import TestCase, override_settings
from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from rest_framework.test import APIClient
import tempfile
import shutil

from barbackend.models import User, Drink, Cart, CartItem, Order, OrderItem, OrderOTP
from barbackend.serializers import CartSerializer, DrinkSerializer


class MediaRootTestCase(TestCase):
    """TestCase that isolates MEDIA_ROOT to a temp directory and cleans it up."""
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._temp_media = tempfile.mkdtemp(prefix="test_media_")
        cls._override = override_settings(MEDIA_ROOT=cls._temp_media)
        cls._override.enable()

    @classmethod
    def tearDownClass(cls):
        try:
            cls._override.disable()
        finally:
            shutil.rmtree(cls._temp_media, ignore_errors=True)
            super().tearDownClass()


def dummy_image(name='test.png'):
    # Generate a valid in-memory PNG via Pillow to satisfy ImageField validation
    bio = io.BytesIO()
    Image.new('RGB', (1, 1), (255, 0, 0)).save(bio, format='PNG')
    bio.seek(0)
    return SimpleUploadedFile(name, bio.getvalue(), content_type='image/png')


class ModelBasicsTest(MediaRootTestCase):
    def test_user_creation(self):
        user = User.objects.create_user(username='alice', email='alice@example.com', password='pw', role='customer')
        self.assertEqual(user.username, 'alice')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(User.objects.filter(email='alice@example.com').exists())

    def test_drink_creation(self):
        drink = Drink.objects.create(name='Coca-Cola', description='Classic Coke', image=dummy_image(), price=Decimal('1.50'), available=True, stock=10)
        self.assertEqual(drink.name, 'Coca-Cola')
        self.assertTrue(drink.available)
        self.assertEqual(Drink.objects.count(), 1)

    def test_order_and_items(self):
        user = User.objects.create_user(username='carol', email='carol@example.com', password='pw', role='customer')
        d1 = Drink.objects.create(name='Water', description='Still water', image=dummy_image('w.png'), price=Decimal('1.00'), available=True, stock=10)
        d2 = Drink.objects.create(name='Orange Juice', description='Freshly squeezed', image=dummy_image('o.png'), price=Decimal('2.00'), available=True, stock=10)
        order = Order.objects.create(user=user, status='pending', total_price=Decimal('0.00'))
        OrderItem.objects.create(order=order, drink=d1, quantity=3)
        OrderItem.objects.create(order=order, drink=d2, quantity=2)
        total = d1.price * 3 + d2.price * 2
        order.refresh_from_db()
        self.assertEqual(order.total_price, total)


class PriceAndSerializerSignalsTest(MediaRootTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='dave', email='dave@example.com', password='pw', role='customer')
        self.drink = Drink.objects.create(
            name='Lemonade',
            description='Fresh',
            image=dummy_image('l.png'),
            price=Decimal('2.50'),
            available=True,
            stock=10,
        )

    def test_order_total_updates_when_drink_price_changes(self):
        order = Order.objects.create(user=self.user, status='pending', total_price=Decimal('0.00'))
        OrderItem.objects.create(order=order, drink=self.drink, quantity=4)
        order.refresh_from_db()
        self.assertEqual(order.total_price, Decimal('10.00'))

        # Change drink price and ensure totals update via signals
        self.drink.price = Decimal('3.00')
        self.drink.save()
        order.refresh_from_db()
        self.assertEqual(order.total_price, Decimal('12.00'))

    def test_cart_serializer_total_reflects_current_drink_prices(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, drink=self.drink, quantity=2)

        data = CartSerializer(cart).data
        self.assertEqual(Decimal(str(data['total_price'])), Decimal('5.00'))

        # Update price and ensure serializer reflects the change
        self.drink.price = Decimal('3.25')
        self.drink.save()
        data = CartSerializer(cart).data
        self.assertEqual(Decimal(str(data['total_price'])), Decimal('6.50'))


class APITest(MediaRootTestCase):
    def setUp(self):
        self.client = APIClient()
        # Create a user and their cart
        self.user = User.objects.create_user(username='eve', email='eve@example.com', password='pw', role='customer')
        self.cart = Cart.objects.create(user=self.user)
        # Drinks
        self.drink1 = Drink.objects.create(name='Cola', description='Soda', image=dummy_image('c.png'), price=Decimal('1.25'), available=True, stock=20)
        self.drink2 = Drink.objects.create(name='Juice', description='OJ', image=dummy_image('j.png'), price=Decimal('2.75'), available=True, stock=20)

    # Drink endpoints
    def test_drink_crud(self):
        # list
        r = self.client.get('/api/drink/')
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.json()), 2)

        # create
        new_img = dummy_image('n.png')
        r = self.client.post('/api/drink/', {
            'name': 'Tea', 'description': 'Hot', 'price': '1.80', 'available': True, 'stock': 5, 'image': new_img
        }, format='multipart')
        self.assertEqual(r.status_code, 201)
        did = r.json()['id']

        # retrieve
        r = self.client.get(f'/api/drink/{did}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['name'], 'Tea')

        # update (PUT)
        upd_img = dummy_image('u.png')
        r = self.client.put(f'/api/drink/{did}/', {
            'name': 'Iced Tea', 'description': 'Cold', 'price': '2.10', 'available': True, 'stock': 15, 'image': upd_img
        }, format='multipart')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['name'], 'Iced Tea')

        # partial_update (PATCH)
        r = self.client.patch(f'/api/drink/{did}/', {'price': '2.30'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['price'], '2.30')

        # destroy
        r = self.client.delete(f'/api/drink/{did}/')
        self.assertEqual(r.status_code, 204)

    # Cart endpoints
    def test_cart_endpoints(self):
        # list (get current cart)
        r = self.client.get('/api/cart/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['items'], [])

        # add_item
        r = self.client.post('/api/cart/items/', {'drink_id': self.drink1.id, 'quantity': 3}, format='json')
        self.assertEqual(r.status_code, 200)
        cart_data = r.json()
        self.assertEqual(len(cart_data['items']), 1)
        item_id = cart_data['items'][0]['id']

        # add same item again increments quantity
        r = self.client.post('/api/cart/items/', {'drink_id': self.drink1.id, 'quantity': 2}, format='json')
        self.assertEqual(r.status_code, 200)
        items = r.json()['items']
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['quantity'], 5)

        # update_item (PUT)
        # Use actual cart PK to satisfy detail route
        r = self.client.put(f'/api/cart/{self.cart.id}/items/{item_id}/', {'quantity': 5}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['items']), 1)

        # update_item (PATCH) reduce quantity
        r = self.client.patch(f'/api/cart/{self.cart.id}/items/{item_id}/', {'quantity': 1}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['items'][0]['quantity'], 1)

        # remove_item
        r = self.client.delete(f'/api/cart/{self.cart.id}/items/{item_id}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['items'], [])

        # add multiple and clear_cart
        self.client.post('/api/cart/items/', {'drink_id': self.drink1.id, 'quantity': 1}, format='json')
        self.client.post('/api/cart/items/', {'drink_id': self.drink2.id, 'quantity': 2}, format='json')
        r = self.client.delete('/api/cart/clear/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['items'], [])

        # partial_update note
        r = self.client.patch('/api/cart/', {'note': 'No ice'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['note'], 'No ice')

    # Orders endpoints including OTP flow
    def test_orders_flow(self):
        # add item to cart
        self.client.post('/api/cart/items/', {'drink_id': self.drink1.id, 'quantity': 2}, format='json')

        # create order from cart
        r = self.client.post('/api/orders/', {}, format='json')
        self.assertEqual(r.status_code, 201)
        order_id = r.json()['id']

        # ensure cart cleared
        r_cart = self.client.get('/api/cart/')
        self.assertEqual(r_cart.status_code, 200)
        self.assertEqual(r_cart.json()['items'], [])

        # list orders
        r = self.client.get('/api/orders/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(o['id'] == order_id for o in r.json()))

        # retrieve
        r = self.client.get(f'/api/orders/{order_id}/')
        self.assertEqual(r.status_code, 200)

        # get_otp should fail before ready
        r = self.client.get(f'/api/orders/{order_id}/otp/')
        self.assertEqual(r.status_code, 400)

        # change_status to ready (generate OTP via signal)
        r = self.client.patch(f'/api/orders/{order_id}/status/', {'status': 'ready'}, format='json')
        self.assertEqual(r.status_code, 200)

        # ensure OTP exists
        self.assertTrue(OrderOTP.objects.filter(order_id=order_id).exists())

        # get_otp
        r = self.client.get(f'/api/orders/{order_id}/otp/')
        self.assertEqual(r.status_code, 200)
        code = r.json()['code']
        self.assertTrue(len(code) >= 4)

        # verify_otp
        r = self.client.post(f'/api/orders/{order_id}/otp/verify/', {'code': code}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('OTP verified', r.json()['detail'])

        # second verify should fail as used
        r = self.client.post(f'/api/orders/{order_id}/otp/verify/', {'code': code}, format='json')
        self.assertEqual(r.status_code, 400)

        # cancel a pending order
        r = self.client.post('/api/cart/items/', {'drink_id': self.drink2.id, 'quantity': 1}, format='json')
        r = self.client.post('/api/orders/', {}, format='json')
        self.assertEqual(r.status_code, 201)
        pending_id = r.json()['id']
        r = self.client.delete(f'/api/orders/{pending_id}/')
        self.assertEqual(r.status_code, 204)

        # cannot cancel non-pending
        r = self.client.post('/api/cart/items/', {'drink_id': self.drink2.id, 'quantity': 1}, format='json')
        r = self.client.post('/api/orders/', {}, format='json')
        self.assertEqual(r.status_code, 201)
        non_pending_id = r.json()['id']
        _ = self.client.patch(f'/api/orders/{non_pending_id}/status/', {'status': 'preparing'}, format='json')
        r = self.client.delete(f'/api/orders/{non_pending_id}/')
        self.assertEqual(r.status_code, 400)


class ModelBehaviorTest(MediaRootTestCase):
    def test_drink_auto_availability(self):
        d = Drink.objects.create(name='Auto', description='', image=dummy_image('a.png'), price=Decimal('1.00'), available=True, stock=10)
        self.assertTrue(d.available)
        d.stock = 3
        d.save()
        d.refresh_from_db()
        self.assertFalse(d.available)
        d.stock = 7
        d.save()
        d.refresh_from_db()
        self.assertTrue(d.available)

    def test_drink_manual_availability_toggle(self):
        d = Drink.objects.create(name='Manual', description='', image=dummy_image('m.png'), price=Decimal('1.00'), available=True, stock=10)
        # Manual toggle via serializer should preserve availability even if stock high
        s = DrinkSerializer(d, data={'available': False}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)
        s.save()
        d.refresh_from_db()
        self.assertFalse(d.available)
        # Increase stock should not auto-enable due to _manual_availability flag set in update
        d.stock = 20
        d.save()
        d.refresh_from_db()
        self.assertFalse(d.available)

    def test_order_total_recalculates_on_item_delete(self):
        u = User.objects.create_user(username='tom', email='tom@example.com', password='pw', role='customer')
        d1 = Drink.objects.create(name='D1', description='', image=dummy_image('d1.png'), price=Decimal('2.00'), available=True, stock=10)
        d2 = Drink.objects.create(name='D2', description='', image=dummy_image('d2.png'), price=Decimal('3.00'), available=True, stock=10)
        o = Order.objects.create(user=u, status='pending', total_price=Decimal('0.00'))
        i1 = OrderItem.objects.create(order=o, drink=d1, quantity=2)  # 4.00
        i2 = OrderItem.objects.create(order=o, drink=d2, quantity=1)  # 3.00
        o.refresh_from_db()
        self.assertEqual(o.total_price, Decimal('7.00'))
        i2.delete()
        o.refresh_from_db()
        self.assertEqual(o.total_price, Decimal('4.00'))


class DrinkThresholdAPITest(MediaRootTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_admin_can_update_single_and_bulk_thresholds(self):
        # Create admin user and authenticate
        admin = User.objects.create_user(username='admin1', email='admin1@example.com', password='pw', role='staff')
        admin.is_staff = True
        admin.save()
        self.client.force_authenticate(user=admin)

        # Create drinks with varying stock
        d1 = Drink.objects.create(name='D1', description='', image=dummy_image('d1.png'), price=Decimal('2.00'), available=True, stock=3)
        d2 = Drink.objects.create(name='D2', description='', image=dummy_image('d2.png'), price=Decimal('3.00'), available=True, stock=7)
        d3 = Drink.objects.create(name='D3', description='', image=dummy_image('d3.png'), price=Decimal('4.00'), available=True, stock=10)

        # 1) Update single drink unavailable threshold to 8 -> d1.stock(3) < 8 so available False
        r = self.client.patch(f'/api/drink/{d1.id}/threshold/', {'unavailable_threshold': 8}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        d1.refresh_from_db()
        self.assertEqual(d1.unavailable_threshold, 8)
        self.assertFalse(d1.available)

        # 2) Bulk update unavailable thresholds to 5 -> availability recomputed for all
        r = self.client.patch('/api/drink/threshold/', {'unavailable_threshold': 5}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        # Validate availability: d1.stock=3 < 5 False, d2.stock=7 >=5 True, d3.stock=10 >=5 True
        d1.refresh_from_db(); d2.refresh_from_db(); d3.refresh_from_db()
        self.assertFalse(d1.available)
        self.assertTrue(d2.available)
        self.assertTrue(d3.available)

    def test_non_admin_forbidden(self):
        user = User.objects.create_user(username='user1', email='user1@example.com', password='pw', role='customer')
        self.client.force_authenticate(user=user)
        d = Drink.objects.create(name='D1', description='', image=dummy_image('d1.png'), price=Decimal('2.00'), available=True, stock=3)
        r = self.client.patch(f'/api/drink/{d.id}/threshold/', {'unavailable_threshold': 9}, format='json')
        self.assertEqual(r.status_code, 403)
        r = self.client.patch('/api/drink/threshold/', {'unavailable_threshold': 9}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_admin_can_update_low_stock_thresholds(self):
        admin = User.objects.create_user(username='admin2', email='admin2@example.com', password='pw', role='staff')
        admin.is_staff = True
        admin.save()
        self.client.force_authenticate(user=admin)
        d1 = Drink.objects.create(name='Warn1', description='', image=dummy_image('w1.png'), price=Decimal('2.00'), available=True, stock=12)
        d2 = Drink.objects.create(name='Warn2', description='', image=dummy_image('w2.png'), price=Decimal('3.00'), available=True, stock=20)
        # Single update
        r = self.client.patch(f'/api/drink/{d1.id}/low-stock-threshold/', {'low_stock_threshold': 15}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        d1.refresh_from_db()
        self.assertEqual(d1.low_stock_threshold, 15)
        # Bulk update
        r = self.client.patch('/api/drink/low-stock-threshold/', {'low_stock_threshold': 25}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        d1.refresh_from_db(); d2.refresh_from_db()
        self.assertEqual(d1.low_stock_threshold, 25)
        self.assertEqual(d2.low_stock_threshold, 25)

    def test_low_stock_threshold_validation(self):
        admin = User.objects.create_user(username='admin3', email='admin3@example.com', password='pw', role='staff')
        admin.is_staff = True
        admin.save()
        self.client.force_authenticate(user=admin)
        d = Drink.objects.create(name='WarnX', description='', image=dummy_image('wx.png'), price=Decimal('2.00'), available=True, stock=5)
        # negative
        r = self.client.patch(f'/api/drink/{d.id}/low-stock-threshold/', {'low_stock_threshold': -1}, format='json')
        self.assertEqual(r.status_code, 400)


class StaffManagementAPITest(MediaRootTestCase):
    """Tests for StaffUserViewset (management endpoints) using 'level' based privilege changes."""

    def setUp(self):
        self.client = APIClient()
        # Primary admin user
        self.admin = User.objects.create_user(username='admin1', email='admin1@example.com', password='pw', role='staff', is_admin=True)
        self.admin.save()
        # Secondary admin to test cross-demotion
        self.admin2 = User.objects.create_user(username='admin2', email='admin2@example.com', password='pw', role='staff', is_admin=True)
        self.admin2.save()
        # Plain staff (domain role staff, not admin, not staff flag initially)
        self.staff = User.objects.create_user(username='staffer', email='staffer@example.com', password='pw', role='staff')
        # Customer user
        self.customer = User.objects.create_user(username='custx', email='custx@example.com', password='pw', role='customer')

    def test_admin_can_list_staff_and_admin_users(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.get('/api/management/')
        self.assertEqual(r.status_code, 200, r.content)
        data = r.json()
        usernames = {u['username'] for u in data}
        self.assertIn('admin1', usernames)
        self.assertIn('admin2', usernames)
        self.assertIn('staffer', usernames)  # domain role staff appears even without staff flag
        self.assertNotIn('custx', usernames)

    def test_non_admin_forbidden_on_list(self):
        self.client.force_authenticate(user=self.staff)
        r = self.client.get('/api/management/')
        self.assertEqual(r.status_code, 403)

    def test_promote_customer_to_staff_level(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(f'/api/management/{self.customer.id}/role/', {'level': 'staff'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, 'staff')
        self.assertTrue(self.customer.is_staff)
        self.assertFalse(self.customer.is_admin)

    def test_promote_customer_to_admin_level(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(f'/api/management/{self.customer.id}/role/', {'level': 'admin'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, 'staff')  # domain role forced to staff
        self.assertTrue(self.customer.is_staff)
        self.assertTrue(self.customer.is_admin)

    def test_demote_admin_to_staff_level(self):
        # admin1 demotes admin2
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(f'/api/management/{self.admin2.id}/role/', {'level': 'staff'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.admin2.refresh_from_db()
        self.assertFalse(self.admin2.is_admin)
        self.assertTrue(self.admin2.is_staff)  # staff flag retained
        self.assertEqual(self.admin2.role, 'staff')

    def test_cannot_self_downgrade_from_admin(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(f'/api/management/{self.admin.id}/role/', {'level': 'staff'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_invalid_level_rejected(self):
        self.client.force_authenticate(user=self.admin)
        r = self.client.patch(f'/api/management/{self.customer.id}/role/', {'level': 'manager'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_non_admin_cannot_modify_privileges(self):
        self.client.force_authenticate(user=self.staff)
        r = self.client.patch(f'/api/management/{self.customer.id}/role/', {'level': 'staff'}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_admin_can_create_staff_user(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'username': 'newstaff',
            'email': 'newstaff@example.com',
            'password': 'StrongPw123!'
        }
        r = self.client.post('/api/management/', payload, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        data = r.json()
        self.assertEqual(data['username'], 'newstaff')
        self.assertEqual(data['role'], 'staff')
        new_user = User.objects.get(username='newstaff')
        self.assertTrue(new_user.is_staff)
        self.assertFalse(new_user.is_admin)

    def test_non_admin_cannot_create_staff_user(self):
        self.client.force_authenticate(user=self.staff)
        payload = {
            'username': 'badcreate',
            'email': 'badcreate@example.com',
            'password': 'StrongPw123!'
        }
        r = self.client.post('/api/management/', payload, format='json')
        self.assertEqual(r.status_code, 403)


class AuthFlowTest(MediaRootTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_token_profile_flow(self):
        # 1) Register a new user
        payload = {
            'username': 'jwt_alice',
            'email': 'jwt_alice@example.com',
            'password': 'Str0ngP@ss!',
        }
        r = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        data = r.json()
        self.assertEqual(data['username'], 'jwt_alice')
        self.assertEqual(data['email'], 'jwt_alice@example.com')
        self.assertEqual(data['role'], 'customer')
        # Ensure password is not returned
        self.assertNotIn('password', data)

        # 2) Invalid credentials should fail
        r = self.client.post('/api/auth/token/', {'username': 'jwt_alice', 'password': 'wrong'}, format='json')
        self.assertEqual(r.status_code, 401)

        # 3) Obtain JWT tokens
        r = self.client.post('/api/auth/token/', {'username': 'jwt_alice', 'password': 'Str0ngP@ss!'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        tokens = r.json()
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        access = tokens['access']
        refresh = tokens['refresh']

        # 4) Unauthenticated profile should be 401
        r = self.client.get('/api/auth/profile/')
        self.assertEqual(r.status_code, 401)

        # 5) Authenticated profile GET
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        r = self.client.get('/api/auth/profile/')
        self.assertEqual(r.status_code, 200)
        prof = r.json()
        self.assertEqual(prof['username'], 'jwt_alice')

        # 6) Profile PATCH to update email
        r = self.client.patch('/api/auth/profile/', {'email': 'new_alice@example.com'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['email'], 'new_alice@example.com')

        # 7) Non-staff cannot escalate role
        r = self.client.patch('/api/auth/profile/', {'role': 'staff'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['role'], 'customer')

        # 8) Refresh token returns new access
        self.client.credentials()  # clear auth for token calls
        r = self.client.post('/api/auth/token/refresh/', {'refresh': refresh}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('access', r.json())


class UserRoleHierarchyTest(MediaRootTestCase):
    def test_is_admin_implies_is_staff(self):
        u = User.objects.create_user(username='hadmin', email='hadmin@example.com', password='pw', role='staff', is_admin=True)
        u.refresh_from_db()
        self.assertTrue(u.is_admin)
        self.assertTrue(u.is_staff)

    def test_staff_not_admin_by_default(self):
        u = User.objects.create_user(username='hstaff', email='hstaff@example.com', password='pw', role='staff')
        self.assertFalse(u.is_admin)
        self.assertFalse(u.is_staff)  # still not staff flag unless manually elevated

    def test_create_superuser_sets_flags(self):
        su = User.objects.create_superuser(username='superx', email='superx@example.com', password='pw')
        self.assertTrue(su.is_superuser)
        self.assertTrue(su.is_staff)
        self.assertTrue(su.is_admin)
