from decimal import Decimal
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Drink, Order, OrderItem


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
