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

CART_EXPIRY_SECONDS = 15 * 60


def _require_platform_admin(user):
    if not getattr(user, "is_authenticated", False) or not getattr(user, "is_admin", False):
        raise PermissionDenied("Admin privileges required.")


class DrinkViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Drink.objects.all()
    serializer_class = DrinkSerializer

    @extend_schema(tags=["Drinks"], summary="List drinks", responses={200: DrinkSerializer(many=True)})
    def list(self, request):
        queryset = Drink.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["Drinks"],
        summary="Create drink",
        request=DrinkSerializer,
        responses={201: DrinkSerializer, 400: OpenApiResponse(description="Validation error")},
    )
    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Drinks"], summary="Retrieve drink", responses={200: DrinkSerializer, 404: OpenApiResponse(description="Not found")})
    def retrieve(self, request, pk=None):
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink)
        return Response(serializer.data)

    @extend_schema(
        tags=["Drinks"],
        summary="Update drink (PUT)",
        request=DrinkSerializer,
        responses={200: DrinkSerializer, 400: OpenApiResponse(description="Validation error")},
    )
    def update(self, request, pk=None):
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
    )
    def partial_update(self, request, pk=None):
        drink = get_object_or_404(Drink, pk=pk)
        serializer = self.serializer_class(drink, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Drinks"], summary="Delete drink", responses={204: OpenApiResponse(description="Deleted"), 404: OpenApiResponse(description="Not found")})
    def destroy(self, request, pk=None):
        drink = get_object_or_404(Drink, pk=pk)
        drink.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="threshold", permission_classes=[permissions.IsAdminUser])
    def update_threshold(self, request, pk=None):
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
        try:
            value = int(request.data.get("unavailable_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "unavailable_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "unavailable_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)

        # Update unavailable_threshold for all drinks
        count1 = Drink.objects.all().update(unavailable_threshold=value)
        # Recompute `available` using the new threshold value
        count2 = Drink.objects.all().update(
            available=Case(
                When(stock__lt=F("unavailable_threshold"), then=Value(False)),
                default=Value(True),
                output_field=BooleanField(),
            )
        )
        return Response({"unavailable_threshold_updated": count1, "available_updated": count2})

    @action(detail=True, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_low_stock_threshold(self, request, pk=None):
        drink = get_object_or_404(Drink, pk=pk)
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        if value < drink.unavailable_threshold:
            return Response(
                {"detail": "low_stock_threshold should be >= unavailable_threshold (current: %d)." % drink.unavailable_threshold},
                status=status.HTTP_400_BAD_REQUEST,
            )
        drink.low_stock_threshold = value
        drink.save(update_fields=["low_stock_threshold"])
        return Response(self.serializer_class(drink).data)

    @action(detail=False, methods=["patch"], url_path="low-stock-threshold", permission_classes=[permissions.IsAdminUser])
    def update_all_low_stock_thresholds(self, request):
        try:
            value = int(request.data.get("low_stock_threshold"))
        except (TypeError, ValueError):
            return Response({"detail": "low_stock_threshold must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if value < 0:
            return Response({"detail": "low_stock_threshold must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)

        min_unavailable = Drink.objects.all().aggregate(mn=models.Min("unavailable_threshold"))["mn"] or 0
        if value < min_unavailable:
            return Response(
                {"detail": f"low_stock_threshold must be >= minimum unavailable_threshold ({min_unavailable})."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated = Drink.objects.all().update(low_stock_threshold=value)
        return Response({"updated": updated})


class OrderViewset(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self, request):
        # request.user is guaranteed to exist because of IsAuthenticated permission
        user = getattr(request, "user", None)
        queryset = Order.objects.select_related("user").prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("drink").order_by("id"))
        )
        if getattr(user, "is_staff", False):
            return queryset
        return queryset.filter(user=user)

    @extend_schema(tags=["Orders"], summary="List orders", responses={200: OrderSerializer(many=True)})
    def list(self, request):
        queryset = self.get_queryset(request)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(tags=["Orders"], summary="Retrieve order", responses={200: OrderSerializer, 404: OpenApiResponse(description="Not found")})
    def retrieve(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        serializer = self.serializer_class(order)
        return Response(serializer.data)

    @extend_schema(tags=["Orders"], summary="Create order from cart", request=None, responses={201: OrderSerializer, 400: OpenApiResponse(description="Validation error")})
    def create(self, request):
        user = getattr(request, "user", None)
        cart = get_object_or_404(
            Cart.objects.prefetch_related(Prefetch("items", queryset=CartItem.objects.select_related("drink"))), user=user
        )
        cart_items = list(cart.items.all())
        if not cart_items:
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
        order_data = {
            "user": user.id,
            "note": cart.note,
            "items": [{"drink_id": item.drink.id, "quantity": item.quantity} for item in cart_items],
        }
        serializer = self.serializer_class(data=order_data)
        if serializer.is_valid():
            order = serializer.save()
            cart.items.all().delete()
            cart.note = ""
            cart.save()
            order = (
                Order.objects.select_related("user")
                .prefetch_related(Prefetch("items", queryset=OrderItem.objects.select_related("drink")))
                .get(pk=order.id)
            )
            return Response(self.serializer_class(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True,
        methods=["patch"],
        url_path="status",
    )
    @extend_schema(
        tags=["Orders"],
        summary="Change order status",
        request=inline_serializer(
            name="OrderStatusPatch",
            fields={"status": drf_serializers.ChoiceField(choices=[c[0] for c in Order.STATUS_CHOICES])},
        ),
        responses={200: OrderSerializer, 400: OpenApiResponse(description="Invalid status")},
    )
    def change_status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save(update_fields=["status"])
        order = (
            Order.objects.select_related("user")
            .prefetch_related(Prefetch("items", queryset=OrderItem.objects.select_related("drink")))
            .get(pk=pk)
        )
        serializer = self.serializer_class(order)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="otp")
    @extend_schema(tags=["Orders"], summary="Get OTP (owner only)")
    def get_otp(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        req_user = getattr(request, "user", None)
        if order.user_id != getattr(req_user, "id", None):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "ready":
            return Response({"detail": "OTP available only when order is ready."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            return Response({"detail": "No OTP yet."}, status=status.HTTP_404_NOT_FOUND)
        if otp.is_used:
            return Response({"detail": "OTP already used."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"code": otp.code_plain})

    @action(detail=True, methods=["post"], url_path="otp/verify")
    @extend_schema(tags=["Orders"], summary="Verify OTP and complete order", request=inline_serializer(name="VerifyOTPRequest", fields={"code": drf_serializers.CharField()}))
    def verify_otp(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        code = str(request.data.get("code", "")).strip()
        if not code:
            return Response({"detail": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            otp = order.otp
        except OrderOTP.DoesNotExist:
            return Response({"detail": "No OTP for this order."}, status=status.HTTP_400_BAD_REQUEST)
        if otp.is_used:
            return Response({"detail": "OTP already used."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.check_code(code):
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
        otp.is_used = True
        otp.save(update_fields=["is_used", "updated_at"])
        order.status = "completed"
        order.save(update_fields=["status"])
        return Response({"detail": "OTP verified. Order completed."})

    @extend_schema(tags=["Orders"], summary="Cancel pending order", responses={204: OpenApiResponse(description="Cancelled"), 400: OpenApiResponse(description="Only pending can be cancelled")})
    def destroy(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        if order.status != "pending":
            return Response({"detail": "Only pending orders can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartViewset(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer
    queryset = Cart.objects.all()

    def get_cart(self, request):
        user = getattr(request, "user", None)
        try:
            cart = (
                Cart.objects.prefetch_related(Prefetch("items", queryset=CartItem.objects.select_related("drink").order_by("id")))
                .get(user=user)
            )
            if (timezone.now() - cart.updated_at).total_seconds() > CART_EXPIRY_SECONDS:
                cart.items.all().delete()
                cart.note = ""
                cart.save()
        except Cart.DoesNotExist:
            cart = Cart.objects.create(user=user)
        return cart

    @extend_schema(tags=["Cart"], summary="Get current cart", responses={200: CartSerializer})
    def list(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @extend_schema(tags=["Cart"], summary="Update cart (PATCH)", request=CartSerializer(partial=True), responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")})
    def partial_update(self, request, pk=None):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["patch"], url_path="")
    def update_cart(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(tags=["Cart"], summary="Clear cart", responses={200: CartSerializer})
    def destroy(self, request, pk=None):
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        url_path="items",
    )
    @extend_schema(
        tags=["Cart"],
        summary="Add item to cart",
        request=inline_serializer(
            name="AddCartItemRequest",
            fields={"drink_id": drf_serializers.IntegerField(), "quantity": drf_serializers.IntegerField(min_value=1)},
        ),
        responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")},
    )
    def add_item(self, request):
        cart = self.get_cart(request)
        serializer = CartItemSerializer(data=request.data)
        if serializer.is_valid():
            drink = serializer.validated_data["drink"]
            quantity = serializer.validated_data["quantity"]
            item, created = CartItem.objects.get_or_create(cart=cart, drink=drink, defaults={"quantity": quantity})
            if not created:
                item.quantity += quantity
                item.save()
            cart.save()
            cart = Cart.objects.prefetch_related(Prefetch("items", queryset=CartItem.objects.select_related("drink"))).get(pk=cart.pk)
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["put", "patch", "delete"], url_path="items/(?P<item_id>[^/.]+)")
    @extend_schema(
        tags=["Cart"],
        summary="Update/remove cart item",
        request=inline_serializer(name="UpdateCartItemRequest", fields={"quantity": drf_serializers.IntegerField(min_value=1, required=False)}),
        responses={200: CartSerializer, 400: OpenApiResponse(description="Validation error")},
    )
    def update_item(self, request, pk=None, item_id=None):
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        if request.method == "DELETE":
            item.delete()
            cart.save()
            cart = Cart.objects.prefetch_related(Prefetch("items", queryset=CartItem.objects.select_related("drink"))).get(pk=cart.pk)
            return Response(CartSerializer(cart).data)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart = Cart.objects.prefetch_related(Prefetch("items", queryset=CartItem.objects.select_related("drink"))).get(pk=cart.pk)
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["delete"], url_path="clear")
    @extend_schema(tags=["Cart"], summary="Clear cart (alias)", responses={200: CartSerializer})
    def clear_cart(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data)


class AuthViewset(viewsets.ViewSet):
    serializer_class = UserSerializer

    @action(detail=False, methods=["post"], url_path="register", permission_classes=[permissions.IsAuthenticated])
    def register(self, request):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get", "patch"], url_path="profile", permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        if request.method.lower() == "get":
            return Response(self.serializer_class(request.user).data)
        serializer = self.serializer_class(request.user, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffUserViewset(viewsets.ViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        _require_platform_admin(request.user)
        qs = User.objects.filter(Q(role="staff") | Q(is_admin=True)).order_by("id").distinct()
        data = self.serializer_class(qs, many=True).data
        return Response(data)

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        _require_platform_admin(request.user)
        payload = request.data.copy()
        payload["role"] = "staff"
        serializer = self.serializer_class(data=payload, context={"request": request})
        if serializer.is_valid():
            user = serializer.save()
            if not user.is_staff:
                user.is_staff = True
                user.save(update_fields=["is_staff"])
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request):
        return self.register(request)

    @action(detail=True, methods=["patch"], url_path="role")
    def update_role(self, request, pk=None):
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        level = request.data.get("level")
        if level not in ["staff", "admin"]:
            return Response({"detail": "Invalid level."}, status=status.HTTP_400_BAD_REQUEST)
        if target.id == request.user.id and target.is_admin and level == "staff":
            return Response({"detail": "Cannot remove your own admin privileges."}, status=status.HTTP_400_BAD_REQUEST)
        if target.role != "staff":
            target.role = "staff"
        if level == "admin":
            target.is_admin = True
            target.is_staff = True
        else:
            target.is_admin = False
            if not target.is_staff:
                target.is_staff = True
        target.save(update_fields=["role", "is_staff", "is_admin"])
        return Response(self.serializer_class(target).data)

    def destroy(self, request, pk=None):
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        if target.id == request.user.id:
            return Response({"detail": "Cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
