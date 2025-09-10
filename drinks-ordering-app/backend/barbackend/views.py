from rest_framework import viewsets, permissions, status
from .serializers import *
from .models import *
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.db.models import F, Case, When, Value, BooleanField, Q
from rest_framework.exceptions import PermissionDenied

def _require_platform_admin(user):
    if not getattr(user, 'is_authenticated', False) or not getattr(user, 'is_admin', False):
        raise PermissionDenied("Admin privileges required.")


class DrinkViewset(viewsets.ViewSet):
    """Public drink catalogue endpoints (list/create/retrieve/update/delete)."""

    permission_classes = [permissions.AllowAny]
    queryset = Drink.objects.all()
    serializer_class = DrinkSerializer
    
    def list(self, request):
        """
        GET /api/drink/
        Returns a list of all drinks
        """
        queryset = Drink.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """
        POST /api/drink/
        Creates a new drink
        """
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """
        GET /api/drink/{id}/
        Returns a specific drink by ID
        """
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """
        PUT /api/drink/{id}/
        Updates a specific drink completely
        """
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """
        PATCH /api/drink/{id}/
        Updates a specific drink partially
        """
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """
        DELETE /api/drink/{id}/
        Deletes a specific drink
        """
        drink = get_object_or_404(Drink, pk=pk)
        drink.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="threshold", permission_classes=[permissions.IsAdminUser])
    def update_threshold(self, request, pk=None):
        """PATCH /api/drink/{id}/threshold/

        Admin-only: Update unavailable_threshold for a single drink and recompute availability.
        Body: { "unavailable_threshold": <int>=5 }
        Note: low_stock_threshold (warning threshold) is unused currently and not set here.
        """
        drink = get_object_or_404(Drink, pk=pk)
        try:
            value = int(request.data.get("unavailable_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "unavailable_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "unavailable_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        drink.unavailable_threshold = value
        # Recompute availability via model logic
        drink.save()
        return Response(self.serializer_class(drink).data)

    @action(detail=False, methods=["patch"], url_path="threshold", permission_classes=[permissions.IsAdminUser])
    def update_all_thresholds(self, request):
        """PATCH /api/drink/threshold/

        Admin-only: Set unavailable_threshold for all drinks and recompute availability in a single DB update.
        Body: { "unavailable_threshold": <int> }
        Returns: { updated: <count> }
        """
        try:
            value = int(request.data.get("unavailable_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "unavailable_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "unavailable_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)

        # First set the threshold for all drinks
        Drink.objects.all().update(unavailable_threshold=value)
        # Then recompute availability based on stock vs new threshold in bulk
        updated = Drink.objects.all().update(
            available=Case(
                When(stock__lt=F('unavailable_threshold'), then=Value(False)),
                default=Value(True),
                output_field=BooleanField(),
            )
        )
        return Response({"updated": updated})

    # --- New low stock (warning) threshold endpoints ---
    @action(detail=True, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_low_stock_threshold(self, request, pk=None):
        """PATCH /api/drink/{id}/low-stock-threshold/

        Admin-only: Update low_stock_threshold (warning threshold) for a single drink.
        This does NOT change availability directly. It is reserved for future notification logic.
        Body: { "low_stock_threshold": <int> }
        Returns: Updated drink representation.
        """
        drink = get_object_or_404(Drink, pk=pk)
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        # (Optional) enforce that warning threshold is >= unavailability threshold to avoid confusion
        if value < drink.unavailable_threshold:
            return Response({"detail": "low_stock_threshold should be >= unavailable_threshold (current: %d)." % drink.unavailable_threshold}, status=status.HTTP_400_BAD_REQUEST)
        drink.low_stock_threshold = value
        drink.save(update_fields=["low_stock_threshold"])
        return Response(self.serializer_class(drink).data)

    @action(detail=False, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_all_low_stock_thresholds(self, request):
        """PATCH /api/drink/low-stock-threshold/

        Admin-only: Bulk update low_stock_threshold (warning threshold) for all drinks.
        Body: { "low_stock_threshold": <int> }
        Returns: { updated: <count> }
        """
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        # Ensure we do not set a warning threshold below any current unavailable_threshold to keep semantic ordering
        min_unavailable = Drink.objects.all().aggregate(mn=models.Min('unavailable_threshold'))['mn'] or 0
        if value < min_unavailable:
            return Response({"detail": f"low_stock_threshold must be >= minimum unavailable_threshold ({min_unavailable})."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Drink.objects.all().update(low_stock_threshold=value)
        return Response({"updated": updated})


class OrderViewset(viewsets.ViewSet):
    """Order endpoints for customers and staff.

    Notes:
    - Currently uses AllowAny with a development fallback to the first user for unauthenticated requests.
    - Contains owner-only OTP retrieval and staff OTP verification actions.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = OrderSerializer

    def get_queryset(self, request):
        """
        Returns a queryset of all orders. (TEMP: does not filter by user)
        """
        return Order.objects.all()

    def list(self, request):
        """
        GET /api/orders/
        - Customer: list own orders
        - Admin: list all orders
        """
        queryset = self.get_queryset(request)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    def retrieve(self, request, pk=None):
        """
        GET /api/orders/{id}/
        - Customer: view own order
        - Admin: view any order
        """
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        serializer = self.serializer_class(order)
        return Response(serializer.data)

    def create(self, request):
        """
        POST /api/orders/
        Submit current cart as a new order.
        Copies cart note and items into the order and sets status to 'pending'.
        Clears the cart after successful submission.
        """
        user = request.user if request.user.is_authenticated else User.objects.first()
        cart = get_object_or_404(Cart, user=user)

        order_data = {
            'user': user.id,
            'note': cart.note,
            'items': [{'drink_id': item.drink.id, 'quantity': item.quantity} for item in cart.items.all()]
        }
        serializer = self.serializer_class(data=order_data)
        if serializer.is_valid():
            serializer.save()
            # Clear cart
            cart.items.all().delete()
            cart.note = ""
            cart.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='status')
    def change_status(self, request, pk=None):
        """
        PATCH /api/orders/{id}/status/
        - Admin only
        Update the status of an order. Acceptable statuses: pending, preparing, ready, completed, cancelled.
        """
        #if not request.user.is_staff:
        #    return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        serializer = self.serializer_class(order)
        return Response(serializer.data)

    # Owner-only: fetch current OTP (plaintext) if order is ready and not completed/cancelled
    @action(detail=True, methods=['get'], url_path='otp')
    def get_otp(self, request, pk=None):
        """
        GET /api/orders/{id}/otp/
        Retrieve the OTP for an order if the order is ready and not completed/cancelled.
        """
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        # Owner-only: compare with authenticated user or fallback first user (dev behavior)
        req_user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else User.objects.first()
        if order.user_id != getattr(req_user, 'id', None):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'ready':
            return Response({'detail': 'OTP available only when order is ready.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            return Response({'detail': 'No OTP yet.'}, status=status.HTTP_404_NOT_FOUND)
        if otp.is_used:
            return Response({'detail': 'OTP already used.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'code': otp.code_plain})


    # Staff action: verify OTP and complete the order
    @action(detail=True, methods=['post'], url_path='otp/verify')
    def verify_otp(self, request, pk=None):
        """
        POST /api/orders/{id}/otp/verify/
        Verify the OTP for an order and complete the order if successful.
        """
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        code = str(request.data.get('code', '')).strip()
        if not code:
            return Response({'detail': 'Code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            return Response({'detail': 'No OTP for this order.'}, status=status.HTTP_400_BAD_REQUEST)
        if otp.is_used:
            return Response({'detail': 'OTP already used.'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.check_code(code):
            return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
        # success
        otp.is_used = True
        otp.save(update_fields=['is_used', 'updated_at'])
        order.status = 'completed'
        order.save(update_fields=['status'])
        return Response({'detail': 'OTP verified. Order completed.'})

    def destroy(self, request, pk=None):
        """
        DELETE /api/orders/{id}/
        Cancel a pending order.
        """
        order = get_object_or_404(Order, pk=pk)  # ignore user check
        if order.status != 'pending':
            return Response({"detail": "Only pending orders can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartViewset(viewsets.GenericViewSet):
    """Shopping cart endpoints for the current user (list/update/add items/clear)."""

    permission_classes = [permissions.AllowAny]
    serializer_class = CartSerializer
    queryset = Cart.objects.all()

    def get_cart(self, request):
        """
        Helper method to get or create the current user's cart.
        """
        user = request.user if request.user.is_authenticated else User.objects.first()
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        """
        GET /api/cart/
        Retrieve the current user's cart with note and items.
        """
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """
        PATCH /api/cart/
        Update cart note or nested items partially.
        """
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Explicit collection-level PATCH endpoint at /api/cart/
    @action(detail=False, methods=['patch'], url_path='')
    def update_cart(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """
        DELETE /api/cart/
        Clear all items and reset note to empty string.
        """
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='items')
    def add_item(self, request):
        """
        POST /api/cart/items/
        Add a new drink to the cart.
        If the drink already exists, increment its quantity.
        """
        cart = self.get_cart(request)
        serializer = CartItemSerializer(data=request.data)
        if serializer.is_valid():
            item, created = CartItem.objects.get_or_create(
                cart=cart,
                drink=serializer.validated_data['drink'],
                defaults={'quantity': serializer.validated_data['quantity']}
            )
            if not created:
                item.quantity += serializer.validated_data['quantity']
                item.save()
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'patch', 'delete'], url_path='items/(?P<item_id>[^/.]+)')
    def update_item(self, request, pk=None, item_id=None):
        """
        PUT/PATCH /api/cart/{cart_id}/items/{item_id}/ -> update quantity of a specific item in the cart.
        DELETE /api/cart/{cart_id}/items/{item_id}/ -> remove item from the cart.
        """
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        if request.method == 'DELETE':
            item.delete()
            return Response(CartSerializer(cart).data)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'], url_path='clear')
    def clear_cart(self, request):
        """
        DELETE /api/cart/clear/
        Clear all items and reset cart note.
        """
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data)


class AuthViewset(viewsets.ViewSet):
    """Authentication endpoints for registration and user profile.

    Routes:
    - POST /api/auth/register: Public user registration. Accepts username, email, password.
      Non-staff callers are always created with role="customer".
    - GET /api/auth/profile: Returns the authenticated user's profile.
    - PATCH /api/auth/profile: Partially updates authenticated user's profile. Non-staff cannot change role.
    """

    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Register a new user.

        Body: { username, email, password, [role] }
        Returns: User data without password.
        """
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'], url_path='profile', permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """Retrieve or update the authenticated user's profile.

        - GET: returns user data.
        - PATCH: updates provided fields (role is ignored for non-staff).
        """
        if request.method.lower() == 'get':
            return Response(self.serializer_class(request.user).data)
        serializer = self.serializer_class(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StaffUserViewset(viewsets.ViewSet):
    """Admin-only staff management.

    Routes:
    - GET /api/staff-users/ : list all users where role='staff' OR is_admin=True.
    - PATCH /api/staff-users/{id}/role/ : update a user's privilege level (staff <-> admin).
      Access: request.user.is_admin must be True for all actions.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        _require_platform_admin(request.user)
        qs = User.objects.filter(Q(role='staff') | Q(is_admin=True)).order_by('id').distinct()
        data = self.serializer_class(qs, many=True).data
        return Response(data)

    @action(detail=True, methods=['patch'], url_path='role')
    def update_role(self, request, pk=None):
        """PATCH /api/staff-users/{id}/role/

        Admin-only: Adjust a user's privilege level (NOT their domain role field) between staff and admin.
        Body: { "level": "staff" | "admin" }
        Behavior:
        - level=admin => sets is_admin=True (which implies is_staff) and ensures user.role='staff'.
        - level=staff => sets is_admin=False, leaves user as staff-level (role='staff', may keep is_staff=True).
        Domain role switching to customer is out of scope for this endpoint.
        Safeguards:
        - Prevent self-demotion if this would remove last admin (simplified: disallow self downgrade to staff).
        """
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        level = request.data.get('level')
        if level not in ['staff', 'admin']:
            return Response({'detail': 'Invalid level.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.id == request.user.id and target.is_admin and level == 'staff':
            return Response({'detail': 'Cannot remove your own admin privileges.'}, status=status.HTTP_400_BAD_REQUEST)
        # Always ensure domain role is 'staff' for managed users here
        if target.role != 'staff':
            target.role = 'staff'
        if level == 'admin':
            target.is_admin = True
            target.is_staff = True
        else:  # staff level
            target.is_admin = False
            # keep is_staff True (do not forcibly drop staff flag)
            if not target.is_staff:
                target.is_staff = True
        target.save(update_fields=['role', 'is_staff', 'is_admin'])
        return Response(self.serializer_class(target).data)