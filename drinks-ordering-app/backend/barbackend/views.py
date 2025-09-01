from rest_framework import viewsets, permissions, status
from .serializers import *
from .models import *
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta


class DrinkViewset(viewsets.ViewSet):
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


class OrderViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = OrderSerializer

    def get_queryset(self, request):
        # TEMP: return all orders without checking user
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
            'items': [{'drink': item.drink.id, 'quantity': item.quantity} for item in cart.items.all()]
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
        if otp.is_used or otp.is_expired:
            return Response({'detail': 'OTP expired or used.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'code': otp.code_plain, 'expires_at': otp.expires_at})

    # Owner-only: regenerate OTP with 60s throttle until order completed/cancelled
    @action(detail=True, methods=['post'], url_path='otp/regenerate')
    def regenerate_otp(self, request, pk=None):
        from django.conf import settings
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        # Owner-only
        req_user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else User.objects.first()
        if order.user_id != getattr(req_user, 'id', None):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if order.status in ('completed', 'cancelled'):
            return Response({'detail': 'Order already finalized.'}, status=status.HTTP_400_BAD_REQUEST)
        if order.status != 'ready':
            return Response({'detail': 'Can regenerate only when order is ready.'}, status=status.HTTP_400_BAD_REQUEST)
        cooldown = getattr(settings, 'OTP_RESEND_COOLDOWN_SECONDS', 60)
        ttl = getattr(settings, 'OTP_TTL_SECONDS', 600)
        now = timezone.now()
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            otp = OrderOTP(order=order, max_attempts=getattr(settings, 'OTP_MAX_ATTEMPTS', 5))
        else:
            if otp.last_sent_at and (now - otp.last_sent_at).total_seconds() < cooldown:
                return Response({'detail': 'Please wait before regenerating.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        from .otp_utils import generate_numeric_code
        code = generate_numeric_code(getattr(settings, 'OTP_CODE_LENGTH', 6))
        otp.set_code(code)
        otp.expires_at = now + timedelta(seconds=ttl)
        otp.attempts = 0
        otp.is_used = False
        otp.last_sent_at = now
        otp.save()
        return Response({'code': otp.code_plain, 'expires_at': otp.expires_at})

    # Staff action: verify OTP and complete the order
    @action(detail=True, methods=['post'], url_path='otp/verify')
    def verify_otp(self, request, pk=None):
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
        if otp.is_expired:
            return Response({'detail': 'OTP expired.'}, status=status.HTTP_400_BAD_REQUEST)
        if otp.attempts >= otp.max_attempts:
            return Response({'detail': 'Too many attempts.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        if not otp.check_code(code):
            otp.attempts += 1
            otp.save(update_fields=['attempts', 'updated_at'])
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



class CartViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = CartSerializer

    def get_cart(self, request):
        # TEMP: return cart of first user
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

    @action(detail=True, methods=['put', 'patch'], url_path='items/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """
        PUT/PATCH /api/cart/items/{item_id}/
        Update quantity of a specific item in the cart.
        """
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        """
        DELETE /api/cart/items/{item_id}/
        Remove a specific item from the cart.
        """
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)

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