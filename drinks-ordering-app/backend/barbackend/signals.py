from decimal import Decimal
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Drink, Order, OrderItem, OrderOTP
from django.db import IntegrityError
from .otp_utils import generate_numeric_code


def recalc_order_total(order: Order) -> None:
    """Recalculate an order's total from its current items and drink prices."""
    total = Decimal('0.00')
    # Sum using current drink prices times quantities
    for item in order.items.select_related('drink').all():
        total += (item.drink.price or Decimal('0.00')) * item.quantity
    # Assign and save only if changed to minimize writes
    if order.total_price != total:
        order.total_price = total
        order.save(update_fields=['total_price', 'updated_at'])


def ensure_order_otp(order: Order) -> None:
    """Create or refresh OTP for an order now in 'ready' state.

    OTPs do not expire or track attempts; they remain valid until used.
    """
    otp, _ = OrderOTP.objects.get_or_create(order=order)
    # Generate and persist a unique code, retrying if a rare race happens
    for _ in range(5):
        code = generate_numeric_code()
        otp.set_code(code)
        otp.is_used = False
        otp.last_sent_at = timezone.now()
        try:
            otp.save(update_fields=['code_hash', 'code_plain', 'is_used', 'last_sent_at', 'updated_at'])
            break
        except IntegrityError:
            continue


@receiver(pre_save, sender=Order)
def on_order_status_change_generate_otp(sender, instance: Order, **kwargs):
    # Only if transitioning to ready
    if not instance.pk:
        return
    try:
        prev = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return
    if prev.status != 'ready' and instance.status == 'ready':
        ensure_order_otp(instance)


@receiver(pre_save, sender=Order)
def on_order_finalize_invalidate_otp(sender, instance: Order, **kwargs):
    # If moving to completed or cancelled, mark otp used/expired
    if not instance.pk:
        return
    try:
        prev = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return
    if prev.status != instance.status and instance.status in ('completed', 'cancelled'):
        OrderOTP.objects.filter(order=instance, is_used=False).update(is_used=True, updated_at=timezone.now())


@receiver(post_save, sender=Drink)
def update_orders_on_drink_change(sender, instance: Drink, created, **kwargs):
    """When a drink is created/updated, update totals of orders containing it.

    We only need to act on updates; creates do not belong to any order yet.
    """
    if created:
        return
    # Find orders that have items with this drink
    order_ids = (
        OrderItem.objects.filter(drink=instance).values_list('order_id', flat=True).distinct()
    )
    for oid in order_ids:
        try:
            order = Order.objects.get(id=oid)
        except Order.DoesNotExist:
            continue
        recalc_order_total(order)


@receiver(post_save, sender=OrderItem)
def update_order_total_on_item_save(sender, instance: OrderItem, created, **kwargs):
    """Recalculate order total when items are added or quantities change."""
    recalc_order_total(instance.order)


@receiver(post_delete, sender=OrderItem)
def update_order_total_on_item_delete(sender, instance: OrderItem, **kwargs):
    """Recalculate order total when an item is removed."""
    recalc_order_total(instance.order)
