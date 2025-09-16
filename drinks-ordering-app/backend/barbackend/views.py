from rest_framework import viewsets, permissions, status
from rest_framework import serializers as drf_serializers
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
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
    inline_serializer,
)
from drf_spectacular.types import OpenApiTypes

def _require_platform_admin(user):
    if not getattr(user, 'is_authenticated', False) or not getattr(user, 'is_admin', False):
        raise PermissionDenied("Admin privileges required.")


class DrinkViewset(viewsets.ViewSet):
    """Public drink catalogue endpoints (list/create/retrieve/update/delete)."""

    permission_classes = [permissions.AllowAny]
    queryset = Drink.objects.all()
    serializer_class = DrinkSerializer
    
    @extend_schema(
        tags=["Drinks"],
        summary="List drinks",
        responses={200: DrinkSerializer(many=True)},
        description="Returns all drinks. Authorization: Bearer JWT required.",
    )
    def list(self, request):
        """
        GET /api/drink/
        Returns a list of all drinks
        """
        queryset = Drink.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        tags=["Drinks"],
        summary="Create drink",
        request=DrinkSerializer,
        responses={201: DrinkSerializer, 400: OpenApiResponse(description="Validation error")},
        examples=[
            OpenApiExample(
                "Create drink (multipart)",
                value={
                    "name": "Cola",
                    "description": "Soda",
                    "price": "1.25",
                    "category": "soft",
                    "available": True,
                    "stock": 10
                },
                request_only=True,
            )
        ],
        description="Create a drink. Use multipart/form-data for image uploads. Authorization: Bearer JWT required.",
    )
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
    
    @extend_schema(
        tags=["Drinks"],
        summary="Retrieve drink",
        responses={200: DrinkSerializer, 404: OpenApiResponse(description="Not found")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Get a drink by ID. Authorization: Bearer JWT required.",
    )
    def retrieve(self, request, pk=None):
        """
        GET /api/drink/{id}/
        Returns a specific drink by ID
        """
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink)
        return Response(serializer.data)
    
    @extend_schema(
        tags=["Drinks"],
        summary="Update drink (PUT)",
        request=DrinkSerializer,
        responses={200: DrinkSerializer, 400: OpenApiResponse(description="Validation error")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Replace a drink. Use multipart/form-data for image. Authorization: Bearer JWT required.",
    )
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
    
    @extend_schema(
        tags=["Drinks"],
        summary="Update drink (PATCH)",
        request=DrinkSerializer(partial=True),
        responses={200: DrinkSerializer, 400: OpenApiResponse(description="Validation error")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Partially update a drink. Authorization: Bearer JWT required.",
    )
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
    
    @extend_schema(
        tags=["Drinks"],
        summary="Delete drink",
        responses={204: OpenApiResponse(description="Deleted"), 404: OpenApiResponse(description="Not found")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Delete a drink. Authorization: Bearer JWT required.",
    )
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

    @extend_schema(
        tags=["Orders"],
        summary="List orders",
        responses={200: OrderSerializer(many=True)},
        description="List orders (all for admin or own for customer). Authorization: Bearer JWT required.",
    )
    def list(self, request):
        """
        GET /api/orders/
        - Customer: list own orders
        - Admin: list all orders
        """
        queryset = self.get_queryset(request)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    @extend_schema(
        tags=["Orders"],
        summary="Retrieve order",
        responses={200: OrderSerializer, 404: OpenApiResponse(description="Not found")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Get order by ID. Authorization: Bearer JWT required.",
    )
    def retrieve(self, request, pk=None):
        """
        GET /api/orders/{id}/
        - Customer: view own order
        - Admin: view any order
        """
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        serializer = self.serializer_class(order)
        return Response(serializer.data)

    @extend_schema(
        tags=["Orders"],
        summary="Create order from cart",
        request=None,
        responses={201: OrderSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Create a new order from the current user's cart. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Orders"],
        summary="Change order status",
        request=inline_serializer(
            name="OrderStatusPatch",
            fields={
                'status': drf_serializers.ChoiceField(choices=[c[0] for c in Order.STATUS_CHOICES])
            }
        ),
        responses={200: OrderSerializer, 400: OpenApiResponse(description="Invalid status")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Set status to one of: pending, preparing, ready, completed, cancelled. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Orders"],
        summary="Get OTP (owner only)",
        responses={
            200: inline_serializer(name='OTPCode', fields={'code': drf_serializers.CharField()}),
            400: OpenApiResponse(description="Not ready or already used"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="No OTP"),
        },
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Returns the plaintext OTP for the order if owner and status=ready. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Orders"],
        summary="Verify OTP and complete order",
        request=inline_serializer(name='VerifyOTPRequest', fields={'code': drf_serializers.CharField()}),
        responses={
            200: inline_serializer(name='VerifyOTPResponse', fields={'detail': drf_serializers.CharField()}),
            400: OpenApiResponse(description="Invalid code or already used"),
            404: OpenApiResponse(description="No OTP"),
        },
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Verify the OTP using JSON body { code: '123456' }. Authorization: Bearer JWT required.",
    )
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

    @extend_schema(
        tags=["Orders"],
        summary="Cancel pending order",
        responses={204: OpenApiResponse(description="Cancelled"), 400: OpenApiResponse(description="Only pending can be cancelled")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Delete an order only if it is pending. Authorization: Bearer JWT required.",
    )
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

    @extend_schema(
        tags=["Cart"],
        summary="Get current cart",
        responses={200: CartSerializer},
        description="Return current user's cart with items. Authorization: Bearer JWT required.",
    )
    def list(self, request):
        """
        GET /api/cart/
        Retrieve the current user's cart with note and items.
        """
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @extend_schema(
        tags=["Cart"],
        summary="Update cart (PATCH)",
        request=CartSerializer(partial=True),
        responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Update cart note or items. Authorization: Bearer JWT required.",
    )
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

    @extend_schema(
        tags=["Cart"],
        summary="Clear cart",
        responses={200: CartSerializer},
        description="Clear all items and reset note. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Cart"],
        summary="Add item to cart",
        request=inline_serializer(name='AddCartItemRequest', fields={
            'drink_id': drf_serializers.IntegerField(),
            'quantity': drf_serializers.IntegerField(min_value=1),
        }),
        responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")},
        description="Add a drink to cart or increment quantity if exists. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Cart"],
        summary="Update/remove cart item",
        parameters=[
            OpenApiParameter(name="pk", type=OpenApiTypes.INT, location=OpenApiParameter.PATH, description="Ignored. Kept only for routing."),
            OpenApiParameter(name="item_id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH, description="CartItem ID"),
        ],
        request=inline_serializer(name='UpdateCartItemRequest', fields={'quantity': drf_serializers.IntegerField(min_value=1, required=False)}),
        responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")},
        description="PUT/PATCH to change quantity; DELETE to remove item. Authorization: Bearer JWT required.",
    )
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
    @extend_schema(
        tags=["Cart"],
        summary="Clear cart (alias)",
        responses={200: CartSerializer},
        description="DELETE /api/cart/clear/ clears all items. Authorization: Bearer JWT required.",
    )
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
    - GET /api/management/ : list all users where role='staff' OR is_admin=True.
    - POST /api/management/ : (legacy) create a new staff-level (non-admin) user.
    - POST /api/management/register/ : preferred endpoint to create a new staff-level (non-admin) user.
    - PATCH /api/management/{id}/role/ : update a user's privilege level (staff <-> admin) using body {"level": "staff"|"admin"}.
        - DELETE /api/management/{id}/ : delete a staff or admin user (admin-only; cannot delete self).
      Access: request.user.is_admin must be True for all actions.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """GET /api/management/
        
        List staff and admin users.

        Returns all users whose domain role is 'staff' or who have admin flag.
        Requires: authenticated admin (request.user.is_admin True).
        Response: 200 JSON array of user objects.
        """
        _require_platform_admin(request.user)
        qs = User.objects.filter(Q(role='staff') | Q(is_admin=True)).order_by('id').distinct()
        data = self.serializer_class(qs, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """POST /api/management/register/

        Create a new staff-level (non-admin) user.
        Body: { username, email, password }
        Behavior:
        - Forces domain role to 'staff'
        - Ensures is_staff=True
        - Leaves is_admin=False
        Returns 201 with created user JSON on success.
        """
        _require_platform_admin(request.user)
        payload = request.data.copy()
        payload['role'] = 'staff'
        serializer = self.serializer_class(data=payload, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            if not user.is_staff:
                user.is_staff = True
                user.save(update_fields=['is_staff'])
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request):  # legacy path support
        return self.register(request)

    @action(detail=True, methods=['patch'], url_path='role')
    def update_role(self, request, pk=None):
        """PATCH /api/management/{id}/role/

        Admin-only: Adjust a user's privilege level between staff and admin.
        Body: { "level": "staff" | "admin" }
        Safeguards: disallow an admin removing their own admin flag.
        """
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        level = request.data.get('level')
        if level not in ['staff', 'admin']:
            return Response({'detail': 'Invalid level.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.id == request.user.id and target.is_admin and level == 'staff':
            return Response({'detail': 'Cannot remove your own admin privileges.'}, status=status.HTTP_400_BAD_REQUEST)
        if target.role != 'staff':
            target.role = 'staff'
        if level == 'admin':
            target.is_admin = True
            target.is_staff = True
        else:
            target.is_admin = False
            if not target.is_staff:
                target.is_staff = True
        target.save(update_fields=['role', 'is_staff', 'is_admin'])
        return Response(self.serializer_class(target).data)

    def destroy(self, request, pk=None):
        """DELETE /api/management/{id}/

        Admin-only: Delete a staff or admin user.
        Safeguards:
        - Cannot delete yourself.
        - Idempotent: deleting a non-existent user returns 404.
        Returns 204 on success.
        """
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        if target.id == request.user.id:
            return Response({'detail': 'Cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        # Optionally, prevent deletion of the last admin, but not required here.
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)