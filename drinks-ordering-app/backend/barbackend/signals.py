# Add these to your existing signals.py file

from decimal import Decimal
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Drink, Order, OrderItem, OrderOTP
from django.db import transaction
from django.db.models import F
from django.db import IntegrityError
from .otp_utils import generate_numeric_code


# ============================================================================
# EXISTING CODE (keep as is)
# ============================================================================

def recalc_order_total(order: Order) -> None:
    """Recalculate an order's total from its current items and drink prices."""
    total = Decimal('0.00')
    for item in order.items.select_related('drink').all():
        total += (item.drink.price or Decimal('0.00')) * item.quantity
    if order.total_price != total:
        order.total_price = total
        order.save(update_fields=['total_price', 'updated_at'])


def ensure_order_otp(order: Order) -> None:
    """Create or refresh OTP for an order now in 'ready' state."""
    otp, _ = OrderOTP.objects.get_or_create(order=order)
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




# ============================================================================
# EXISTING SIGNALS (keep as is)
# ============================================================================

@receiver(pre_save, sender=Order)
def on_order_status_change_generate_otp(sender, instance: Order, **kwargs):
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
    if not instance.pk:
        return
    try:
        prev = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return
    if prev.status != instance.status and instance.status in ('completed', 'cancelled'):
        OrderOTP.objects.filter(order=instance, is_used=False).update(is_used=True, updated_at=timezone.now())


@receiver(pre_save, sender=Order)
def adjust_inventory_on_status_change(sender, instance: Order, **kwargs):
    """Handle inventory deduction/restock when order status changes."""
    if not instance.pk:
        return
    try:
        prev = Order.objects.select_related().get(pk=instance.pk)
    except Order.DoesNotExist:
        return
    if prev.status == instance.status:
        return

    # Deduct path: leaving pending -> (preparing|ready|completed) etc., excluding cancelled immediate jump
    if prev.status == 'pending' and instance.status != 'cancelled' and not prev.inventory_deducted:
        with transaction.atomic():
            items = list(prev.items.select_related('drink').all())
            for it in items:
                Drink.objects.filter(pk=it.drink_id).update(stock=F('stock') - it.quantity)
                # Refresh drink from DB and update availability
                drink = Drink.objects.get(pk=it.drink_id)
                update_drink_availability(drink)
            instance.inventory_deducted = True
    # Restock path: moving to cancelled AFTER deduction happened
    elif instance.status == 'cancelled' and prev.inventory_deducted:
        with transaction.atomic():
            items = list(prev.items.select_related('drink').all())
            for it in items:
                Drink.objects.filter(pk=it.drink_id).update(stock=F('stock') + it.quantity)
                # Refresh drink from DB and update availability
                drink = Drink.objects.get(pk=it.drink_id)
                update_drink_availability(drink)
            instance.inventory_deducted = False
    else:
        instance.inventory_deducted = prev.inventory_deducted


@receiver(post_save, sender=Drink)
def update_orders_on_drink_change(sender, instance: Drink, created, **kwargs):
    """When a drink is created/updated, update totals of orders containing it."""
    if created:
        return
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


# ============================================================================
# NEW: AUTOMATIC AVAILABILITY SWITCHING
# ============================================================================



# ============================================================================
# BULK SYNC HELPER
# ============================================================================

def sync_all_drink_availability():
    """
    Synchronize availability for all drinks based on current stock.
    Call this manually if you need to fix availability out-of-sync issues.
    """
    from django.db.models import Count
    
    updated_count = 0
    for drink in Drink.objects.all():
        old_available = drink.available
        drink.available = drink.stock > drink.unavailable_threshold
        
        if drink.available != old_available:
            drink.save(update_fields=['available', 'updated_at'])
            updated_count += 1
    
    return updated_count