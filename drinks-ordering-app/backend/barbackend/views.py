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
from django.http import JsonResponse
from django.core.mail import EmailMultiAlternatives
from decimal import Decimal
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import threading

CART_EXPIRY_SECONDS = 15*60

def ping(request):
    return JsonResponse({"status": "alive"})

def _require_platform_admin(user):
    if not getattr(user, 'is_authenticated', False) or not getattr(user, 'is_admin', False):
        raise PermissionDenied("Admin privileges required.")


class DrinkViewset(viewsets.ViewSet):
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
        updated = Drink.objects.all().update(
            unavailable_threshold=value,
            available=Case(
                When(stock__lt=value, then=Value(False)),
                default=Value(True),
                output_field=BooleanField(),
            )
        )
        return Response({"updated": updated})

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
            return Response({"detail": "low_stock_threshold should be >= unavailable_threshold (current: %d)." % drink.unavailable_threshold}, status=status.HTTP_400_BAD_REQUEST)
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
        min_unavailable = Drink.objects.all().aggregate(mn=models.Min('unavailable_threshold'))['mn'] or 0
        if value < min_unavailable:
            return Response({"detail": f"low_stock_threshold must be >= minimum unavailable_threshold ({min_unavailable})."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Drink.objects.all().update(low_stock_threshold=value)
        return Response({"updated": updated})


class OrderViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = OrderSerializer

    def get_queryset(self, request):
        user = request.user if request.user.is_authenticated else User.objects.filter(role='staff').first()
        queryset = Order.objects.select_related('user').prefetch_related(
            Prefetch('items', queryset=OrderItem.objects.select_related('drink')),
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
        user = request.user if request.user.is_authenticated else User.objects.first()
        cart = Cart.objects.prefetch_related(
            Prefetch('items', queryset=CartItem.objects.select_related('drink'))
        ).get(user=user)
        order_data = {
            'user': user.id,
            'note': cart.note,
            'items': [{'drink_id': item.drink.id, 'quantity': item.quantity} for item in cart.items.all()]
        }
        serializer = self.serializer_class(data=order_data)
        if serializer.is_valid():
            order = serializer.save()
            cart.items.all().delete()
            cart.note = ""
            cart.save()
            return Response(self.serializer_class(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], url_path='status')
    @extend_schema(
        tags=["Orders"],
        summary="Change order status",
        request=inline_serializer(
            name="OrderStatusPatch",
            fields={'status': drf_serializers.ChoiceField(choices=[c[0] for c in Order.STATUS_CHOICES])}
        ),
        responses={200: OrderSerializer, 400: OpenApiResponse(description="Invalid status")},
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Set status to one of: pending, preparing, ready, completed, cancelled. Authorization: Bearer JWT required.",
    )
    def change_status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        old_status = order.status
        order.status = new_status
        order.save()
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
        order = get_object_or_404(self.get_queryset(request), pk=pk)
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
        order = get_object_or_404(Order, pk=pk)
        if order.status != 'pending':
            return Response({"detail": "Only pending orders can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='recent')
    @extend_schema(
        tags=["Orders"],
        summary="Get recent orders and updates",
        parameters=[
            OpenApiParameter(name="since", type=OpenApiTypes.DATETIME, description="Get orders updated after this timestamp")
        ],
        responses={200: OrderSerializer(many=True)}
    )
    def recent(self, request):
        since_param = request.query_params.get('since')
        if since_param:
            try:
                since = timezone.datetime.fromisoformat(since_param.replace('Z', '+00:00'))
            except:
                since = timezone.now() - timedelta(seconds=30)
        else:
            since = timezone.now() - timedelta(seconds=30)
        queryset = self.get_queryset(request).filter(
            models.Q(created_at__gt=since) | models.Q(updated_at__gt=since)
        )
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send-reminder')
    @extend_schema(
        tags=["Orders"],
        summary="Send pickup reminder (triggers notification on client)",
        responses={200: OpenApiResponse(description="Reminder triggered")}
    )
    def send_reminder(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        if order.status != 'ready':
            return Response({'detail': 'Can only remind for ready orders'}, status=status.HTTP_400_BAD_REQUEST)
        order.save(update_fields=['updated_at'])
        return Response({'detail': 'Reminder sent'})

    @action(detail=True, methods=['post'], url_path='email-receipt')
    @extend_schema(
        tags=["Orders"],
        summary="Email receipt to customer",
        responses={
            200: inline_serializer(name='EmailReceiptResponse', fields={'detail': drf_serializers.CharField()}),
            400: OpenApiResponse(description="No email on file"),
            500: OpenApiResponse(description="Failed to send")
        },
        parameters=[OpenApiParameter(name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH)],
        description="Send order receipt via email. Authorization: Bearer JWT required.",
    )
    

    @action(detail=True, methods=['post'], url_path='email-receipt')
    def email_receipt(self, request, pk=None):
        order = get_object_or_404(self.get_queryset(request), pk=pk)
        user = order.user
        
        if not user.email:
            return Response({'detail': 'No email address on file'}, status=status.HTTP_400_BAD_REQUEST)
        
        def send_email_async():
            try:
                from django.conf import settings
                
                order = Order.objects.prefetch_related(
                    Prefetch('items', queryset=OrderItem.objects.select_related('drink'))
                ).get(pk=pk)
                
                items = []
                subtotal = Decimal('0.00')
                for item in order.items.all():
                    item_total = item.drink.price * item.quantity
                    subtotal += item_total
                    items.append({
                        'name': item.drink.name,
                        'quantity': item.quantity,
                        'price': f"{item.drink.price:.2f}",
                        'total': f"{item_total:.2f}"
                    })
                
                vat = subtotal * Decimal('0.15')
                total = subtotal
                subtotal = total * Decimal('0.85')
                formatted_date = order.created_at.strftime('%B %d, %Y at %I:%M %p')
                
                context = {
                    'order_id': order.id,
                    'order_date': formatted_date,
                    'customer_name': user.username,
                    'order_status': order.status.title(),
                    'items': items,
                    'subtotal': f"{subtotal:.2f}",
                    'vat': f"{vat:.2f}",
                    'total': f"{total:.2f}",
                }
                
                html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;}}
            .header {{text-align: center; padding: 20px 0; border-bottom: 3px solid #F59E0B; margin-bottom: 30px;}}
            .logo {{font-size: 32px; font-weight: bold; color: #F59E0B; margin: 0;}}
            .tagline {{font-size: 14px; color: #666; font-style: italic;}}
            .info-section {{margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;}}
            .info-row {{display: flex; justify-content: space-between; padding: 5px 0;}}
            .label {{font-weight: bold; color: #555;}}
            .items-table {{width: 100%; border-collapse: collapse; margin: 20px 0;}}
            .items-table th {{background: #2563EB; color: white; padding: 10px; text-align: left;}}
            .items-table td {{padding: 10px; border-bottom: 1px solid #ddd;}}
            .totals {{margin: 20px 0; text-align: right;}}
            .total-row {{padding: 5px 0;}}
            .grand-total {{font-size: 20px; font-weight: bold; color: #F59E0B; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;}}
            .footer {{text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ddd; color: #666;}}
            .thank-you {{font-size: 18px; color: #2563EB; font-weight: bold;}}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 class="logo">SwiftServe</h1>
            <p class="tagline">Skip the queue!</p>
        </div>
        <div class="info-section">
            <div class="info-row"><span class="label">Receipt #:</span><span>{context['order_id']}</span></div>
            <div class="info-row"><span class="label">Date:</span><span>{context['order_date']}</span></div>
            <div class="info-row"><span class="label">Customer:</span><span>{context['customer_name']}</span></div>
            <div class="info-row"><span class="label">Status:</span><span>{context['order_status']}</span></div>
        </div>
        <table class="items-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>{''.join(f'<tr><td>{item["name"]}</td><td>{item["quantity"]}</td><td>R{item["price"]}</td><td>R{item["total"]}</td></tr>' for item in context['items'])}</tbody>
        </table>
        <div class="totals">
            <div class="total-row"><span>Subtotal: R{context['subtotal']}</span></div>
            <div class="total-row"><span>VAT (15%): R{context['vat']}</span></div>
            <div class="total-row grand-total"><span>Total: R{context['total']}</span></div>
        </div>
        <div class="footer">
            <p class="thank-you">Thank you for your order!</p>
            <p>For support, contact us at support@swiftserve.com</p>
        </div>
    </body>
    </html>
                """
                
                text_content = f"""SwiftServe - Skip the queue!
    ========================================
    RECEIPT #{context['order_id']}
    Date: {context['order_date']}
    Customer: {context['customer_name']}
    Status: {context['order_status']}
    ----------------------------------------
    ITEMS:
    {''.join(f"{item['name']}\n  Qty: {item['quantity']} x R{item['price']} = R{item['total']}\n" for item in context['items'])}----------------------------------------
    Subtotal: R{context['subtotal']}
    VAT (15%): R{context['vat']}
    TOTAL: R{context['total']}
    ========================================
    Thank you for your order!
    For support, contact us at: support@swiftserve.com"""
                
                # Use SendGrid HTTP API instead of SMTP
                message = Mail(
                    from_email='fatensaud04@gmail.com',
                    to_emails=user.email,
                    subject=f'SwiftServe Receipt #{order.id}',
                    plain_text_content=text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                response = sg.send(message)
                print(f"Email sent successfully to {user.email}. Status: {response.status_code}")
                
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Start background thread
        thread = threading.Thread(target=send_email_async)
        thread.daemon = True
        thread.start()
        
        return Response({'detail': 'Receipt is being sent to your email'}, status=status.HTTP_200_OK)


class CartViewset(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = CartSerializer
    queryset = Cart.objects.all()

    def get_cart(self, request):
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
        cart = self.get_cart(request)
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
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            return Response(CartSerializer(cart).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'], url_path='')
    def update_cart(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cart.save()
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
        cart = self.get_cart(request)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        if request.method == 'DELETE':
            item.delete()
            cart.save()
            cart = Cart.objects.prefetch_related(
                Prefetch('items', queryset=CartItem.objects.select_related('drink'))
            ).get(pk=cart.pk)
            return Response(CartSerializer(cart).data)
        serializer = CartItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
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
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.note = ""
        cart.save()
        return Response(CartSerializer(cart).data)


class AuthViewset(viewsets.ViewSet):
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'], url_path='register', permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.serializer_class(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'], url_path='profile', permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        if request.method.lower() == 'get':
            return Response(self.serializer_class(request.user).data)
        serializer = self.serializer_class(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffUserViewset(viewsets.ViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        _require_platform_admin(request.user)
        qs = User.objects.filter(Q(role='staff') | Q(is_admin=True)).order_by('id').distinct()
        data = self.serializer_class(qs, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
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
        return self.register(request)

    @action(detail=True, methods=['patch'], url_path='role')
    def update_role(self, request, pk=None):
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
        _require_platform_admin(request.user)
        target = get_object_or_404(User, pk=pk)
        if target.id == request.user.id:
            return Response({'detail': 'Cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)