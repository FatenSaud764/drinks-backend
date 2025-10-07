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
from django.db.models import F, Case, When, Value, BooleanField, Q, Prefetch
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
    inline_serializer,
)
from drf_spectacular.types import OpenApiTypes
from django.db import transaction
import logging
from django.http import JsonResponse

CART_EXPIRY_SECONDS = 15*60  # 15 minutes

def ping(request):
    return JsonResponse({"status": "alive"})

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
        """GET /api/drink/ - Returns a list of all drinks"""
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
        """POST /api/drink/ - Creates a new drink"""
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
        """GET /api/drink/{id}/ - Returns a specific drink by ID"""
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
        """PUT /api/drink/{id}/ - Updates a specific drink completely"""
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
        """PATCH /api/drink/{id}/ - Updates a specific drink partially"""
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
        """DELETE /api/drink/{id}/ - Deletes a specific drink"""
        drink = get_object_or_404(Drink, pk=pk)
        drink.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="threshold", permission_classes=[permissions.IsAdminUser])
    def update_threshold(self, request, pk=None):
        """PATCH /api/drink/{id}/threshold/ - Admin-only: Update unavailable_threshold"""
        drink = get_object_or_404(Drink, pk=pk)
        try:
            value = int(request.data.get("unavailable_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "unavailable_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "unavailable_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        drink.unavailable_threshold = value
        drink.save()
        return Response(self.serializer_class(drink).data)

    @action(detail=False, methods=["patch"], url_path="threshold", permission_classes=[permissions.IsAdminUser])
    def update_all_thresholds(self, request):
        """PATCH /api/drink/threshold/ - Admin-only: Bulk update thresholds"""
        try:
            value = int(request.data.get("unavailable_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "unavailable_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "unavailable_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)

        Drink.objects.all().update(unavailable_threshold=value)
        updated = Drink.objects.all().update(
            available=Case(
                When(stock__lt=F('unavailable_threshold'), then=Value(False)),
                default=Value(True),
                output_field=BooleanField(),
            )
        )
        return Response({"updated": updated})

    @action(detail=True, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_low_stock_threshold(self, request, pk=None):
        """PATCH /api/drink/{id}/low-stock-threshold/ - Update warning threshold"""
        drink = get_object_or_404(Drink, pk=pk)
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        if value < drink.unavailable_threshold:
            return Response({"detail": "low_stock_threshold should be >= unavailable_threshold (current: %d)." % drink.unavailable_threshold}, status=status.HTTP_400_BAD_REQUEST)
        drink.low_stock_threshold = value
        drink.save(update_fields=["low_stock_threshold"])
        return Response(self.serializer_class(drink).data)

    @action(detail=False, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_all_low_stock_thresholds(self, request):
        """PATCH /api/drink/low-stock-threshold/ - Bulk update warning thresholds"""
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        min_unavailable = Drink.objects.all().aggregate(mn=models.Min('unavailable_threshold'))['mn'] or 0
        if value < min_unavailable:
            return Response({"detail": f"low_stock_threshold must be >= minimum unavailable_threshold ({min_unavailable})."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Drink.objects.all().update(low_stock_threshold=value)
        return Response({"updated": updated})




logger = logging.getLogger(__name__)


class OrderViewset(viewsets.ViewSet):
    """Order endpoints for customers and staff."""

    permission_classes = [permissions.AllowAny]
    serializer_class = OrderSerializer

    def get_queryset(self, request):
        """Returns filtered queryset with optimized prefetch"""
        user = request.user if request.user.is_authenticated else User.objects.filter(role='staff').first()

        # CRITICAL OPTIMIZATION: Prefetch all related data
        queryset = Order.objects.select_related('user').prefetch_related(
            Prefetch(
                'items',
                queryset=OrderItem.objects.select_related('drink')
            ),
            'otp'
        )

        if hasattr(user, 'is_staff') and user.is_staff:
            return queryset.all()
        return queryset.filter(user=user)

    @extend_schema(
        tags=["Orders"],
        summary="List orders",
        responses={200: OrderSerializer(many=True)},
        description="List orders (all for admin or own for customer). Authorization: Bearer JWT required.",
    )
    def list(self, request):
        """GET /api/orders/ - Customer: list own orders, Admin: list all orders"""
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
        """GET /api/orders/{id}/ - Customer: view own order, Admin: view any order"""
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
        """POST /api/orders/ - Submit current cart as a new order"""
        user = request.user if request.user.is_authenticated else User.objects.first()
        
        # OPTIMIZATION: Prefetch cart items with drinks
        try:
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(user=user)
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'Cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not cart.items.exists():
            return Response(
                {'detail': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order_data = {
            'user': user.id,
            'note': cart.note,
            'items': [{'drink_id': item.drink.id, 'quantity': item.quantity} 
                    for item in cart.items.all()]
        }
        
        serializer = self.serializer_class(data=order_data)
        if serializer.is_valid():
            order = serializer.save()

            # Clear cart
            cart.items.all().delete()
            cart.note = ""
            cart.save()
            
            logger.info(f"Order {order.id} created for user {user.id}")
            return Response(self.serializer_class(order).data, status=status.HTTP_201_CREATED)
        
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
        Update the status of an order and automatically send appropriate message.
        """
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use select_for_update to prevent race conditions
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=pk)
                old_status = order.status
                order.status = new_status
                order.save(update_fields=['status', 'updated_at'])
                
                logger.info(f"Order {pk} status changed: {old_status} -> {new_status}")
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # OPTIMIZATION: Refetch with prefetch for serialization
        order = Order.objects.prefetch_related(
            Prefetch('items', queryset=OrderItem.objects.select_related('drink'))
        ).get(pk=pk)
        
        serializer = self.serializer_class(order)
        return Response(serializer.data)

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
        """GET /api/orders/{id}/otp/ - Retrieve OTP if order is ready"""
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        req_user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else User.objects.first()
        
        if order.user_id != getattr(req_user, 'id', None):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status != 'ready':
            return Response(
                {'detail': 'OTP available only when order is ready.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            return Response({'detail': 'No OTP yet.'}, status=status.HTTP_404_NOT_FOUND)
        
        if otp.is_used:
            return Response(
                {'detail': 'OTP already used.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'code': otp.code_plain})

    @extend_schema(
        tags=["Orders"],
        summary="Verify OTP and complete order",
        request=inline_serializer(
            name='VerifyOTPRequest', 
            fields={'code': drf_serializers.CharField()}
        ),
        responses={
            200: inline_serializer(
                name='VerifyOTPResponse', 
                fields={'detail': drf_serializers.CharField()}
            ),
            400: OpenApiResponse(description="Invalid code or already used"),
            404: OpenApiResponse(description="Order or OTP not found"),
            409: OpenApiResponse(description="Order is being processed by another request"),
        },
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Verify the OTP using JSON body { code: '123456' }. Authorization: Bearer JWT required.",
    )
    @action(detail=True, methods=['post'], url_path='otp/verify')
    def verify_otp(self, request, pk=None):
        """POST /api/orders/{id}/otp/verify/ - Verify OTP and complete order"""
        start_time = timezone.now()
        logger.info(f"OTP verification started for order {pk}")
        
        try:
            code = str(request.data.get('code', '')).strip()
            if not code:
                return Response(
                    {'detail': 'Code is required.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # FIXED: Single optimized query with row locking
                try:
                    order = Order.objects.select_related('otp').select_for_update(
                        nowait=True  # Fail fast instead of waiting for lock
                    ).get(pk=pk)
                except Order.DoesNotExist:
                    logger.warning(f"Order {pk} not found during OTP verification")
                    return Response(
                        {'detail': 'Order not found.'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                except DatabaseError as e:
                    # Lock already held by another request
                    logger.warning(f"Order {pk} is locked by another request: {e}")
                    return Response(
                        {'detail': 'Order is being processed. Please try again.'}, 
                        status=status.HTTP_409_CONFLICT
                    )

                # Access OTP (already loaded via select_related)
                try:
                    otp = order.otp
                except OrderOTP.DoesNotExist:
                    logger.warning(f"No OTP found for order {pk}")
                    return Response(
                        {'detail': 'No OTP for this order.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if otp.is_used:
                    logger.warning(f"OTP already used for order {pk}")
                    return Response(
                        {'detail': 'OTP already used.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verify code
                try:
                    valid = otp.check_code(code)
                except Exception as e:
                    logger.exception(f"Error checking OTP for order {pk}: {e}")
                    return Response(
                        {'detail': 'Internal error verifying code.'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                if not valid:
                    logger.warning(f"Invalid OTP code provided for order {pk}")
                    return Response(
                        {'detail': 'Invalid code.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Mark used & complete atomically
                otp.is_used = True
                otp.save(update_fields=['is_used', 'updated_at'])

                order.status = 'completed'
                order.save(update_fields=['status', 'updated_at'])

            elapsed = (timezone.now() - start_time).total_seconds()
            logger.info(f"OTP verification completed for order {pk} in {elapsed:.2f}s")
            
            return Response({'detail': 'OTP verified. Order completed.'})
            
        except Exception as exc:
            elapsed = (timezone.now() - start_time).total_seconds()
            logger.exception(f"Unexpected error verifying OTP for order {pk} after {elapsed:.2f}s: {exc}")
            return Response(
                {'detail': 'Internal server error.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, pk=None):
        """DELETE /api/orders/{id}/ - Cancel a pending order"""
        order = get_object_or_404(Order, pk=pk)
        
        if order.status != 'pending':
            return Response(
                {"detail": "Only pending orders can be cancelled"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.delete()
        logger.info(f"Order {pk} deleted")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='recent')
    @extend_schema(
        tags=["Orders"],
        summary="Get recent orders and updates",
        parameters=[
            OpenApiParameter(
                name="since", 
                type=OpenApiTypes.DATETIME,
                description="Get orders updated after this timestamp"
            )
        ],
        responses={200: OrderSerializer(many=True)}
    )
    def recent(self, request):
        """GET /api/orders/recent/?since=<timestamp> - Get recently created OR updated orders"""
        since_param = request.query_params.get('since')
        
        if since_param:
            try:
                since = timezone.datetime.fromisoformat(since_param.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                since = timezone.now() - timedelta(seconds=30)
        else:
            since = timezone.now() - timedelta(seconds=30)
        
        # Check BOTH created_at AND updated_at
        queryset = self.get_queryset(request).filter(
            Q(created_at__gt=since) | Q(updated_at__gt=since)
        )
        
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='send-reminder')
    @extend_schema(
        tags=["Orders"],
        summary="Send pickup reminder (triggers notification on client)",
        responses={
            200: OpenApiResponse(description="Reminder triggered"),
            400: OpenApiResponse(description="Order not ready"),
            404: OpenApiResponse(description="Order not found")
        }
    )
    def send_reminder(self, request, pk=None):
        """POST /api/orders/{id}/send-reminder/ - Staff triggers a reminder"""
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        
        if order.status != 'ready':
            return Response(
                {'detail': 'Can only send reminders for ready orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the order's updated_at timestamp to trigger polling
        order.save(update_fields=['updated_at'])
        
        logger.info(f"Reminder sent for order {pk}")
        return Response({'detail': 'Reminder sent'})

class CartViewset(viewsets.GenericViewSet):
    """Shopping cart endpoints for the current user."""

    permission_classes = [permissions.AllowAny]
    serializer_class = CartSerializer
    queryset = Cart.objects.all()

    def get_cart(self, request):
        """Helper method to get or create the current user's cart with expiry check"""
        user = request.user if request.user.is_authenticated else User.objects.first()
        cart, created = Cart.objects.get_or_create(user=user)

        if not created and (timezone.now() - cart.updated_at).total_seconds() > CART_EXPIRY_SECONDS:
            cart.items.all().delete()
            cart.note = ""
            cart.save()

        return cart

    @extend_schema(
        tags=["Cart"],
        summary="Get current cart",
        responses={200: CartSerializer},
        description="Return current user's cart with items. Authorization: Bearer JWT required.",
    )
    def list(self, request):
        """GET /api/cart/ - Retrieve the current user's cart with note and items"""
        cart = self.get_cart(request)
        
        # CRITICAL OPTIMIZATION: Refetch with prefetch for serialization
        cart = Cart.objects.prefetch_related(
            Prefetch('items', queryset=CartItem.objects.select_related('drink'))
        ).get(pk=cart.pk)
        
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
        """PATCH /api/cart/ - Update cart note or nested items"""
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
            
            # OPTIMIZATION: Refetch with prefetch
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'], url_path='')
    def update_cart(self, request):
        """Explicit collection-level PATCH endpoint at /api/cart/"""
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
            
            # OPTIMIZATION: Refetch with prefetch
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        tags=["Cart"],
        summary="Clear cart",
        responses={200: CartSerializer},
        description="Clear all items and reset note. Authorization: Bearer JWT required.",
    )
    def destroy(self, request, pk=None):
        """DELETE /api/cart/ - Clear all items and reset note"""
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
        """POST /api/cart/items/ - Add a new drink to the cart"""
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
            cart.save()
            
            # OPTIMIZATION: Refetch with prefetch
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            
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
        """PUT/PATCH/DELETE /api/cart/{cart_id}/items/{item_id}/ - Update or remove cart item"""
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        
        if request.method == 'DELETE':
            item.delete()
            cart.save()
            
            # OPTIMIZATION: Refetch with prefetch
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            
            return Response(CartSerializer(cart).data)
        
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # OPTIMIZATION: Refetch with prefetch
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            
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
        """DELETE /api/cart/clear/ - Clear all items and reset cart note"""
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data)


class AuthViewset(viewsets.ViewSet):
    """Authentication endpoints for registration and user profile."""

    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register(self, request):
        """POST /api/auth/register - Register a new user"""
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'], url_path='profile', permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """GET/PATCH /api/auth/profile - Retrieve or update authenticated user's profile"""
        if request.method.lower() == 'get':
            return Response(self.serializer_class(request.user).data)
        serializer = self.serializer_class(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffUserViewset(viewsets.ViewSet):
    """Admin-only staff management."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """GET /api/management/ - List staff and admin users"""
        _require_platform_admin(request.user)
        qs = User.objects.filter(Q(role='staff') | Q(is_admin=True)).order_by('id').distinct()
        data = self.serializer_class(qs, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """POST /api/management/register/ - Create a new staff-level user"""
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

    def create(self, request):
        """Legacy path support"""
        return self.register(request)

    @action(detail=True, methods=['patch'], url_path='role')
    def update_role(self, request, pk=None):
        """PATCH /api/management/{id}/role/ - Adjust user privilege level"""
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
        """DELETE /api/management/{id}/ - Delete a staff or admin user"""
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        if target.id == request.user.id:
            return Response({'detail': 'Cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)