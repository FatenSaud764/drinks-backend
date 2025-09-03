from rest_framework import viewsets, permissions, status
from .serializers import *
from .models import *
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404


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


class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def list(self, request):
        """
        GET /api/user/
        Returns a list of all users
        """
        queryset = User.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """
        POST /api/user/
        Creates a new user
        """
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """
        GET /api/user/{id}/
        Returns a specific user by ID
        """
        user = get_object_or_404(User, pk=pk)
        serializer = self.serializer_class(user)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """
        PUT /api/user/{id}/
        Updates a specific user completely
        """
        user = get_object_or_404(User, pk=pk)
        serializer = self.serializer_class(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """
        DELETE /api/user/{id}/
        Deletes a specific user
        """
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
