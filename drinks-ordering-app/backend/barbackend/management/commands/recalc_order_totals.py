from django.core.management.base import BaseCommand
from barbackend.models import Order
from barbackend.signals import recalc_order_total


class Command(BaseCommand):
    help = "Recalculate total_price for all orders from current drink prices."

    def handle(self, *args, **options):
        count = 0
        for order in Order.objects.all().iterator():
            recalc_order_total(order)
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Recalculated totals for {count} orders."))
