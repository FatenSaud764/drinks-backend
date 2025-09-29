from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('barbackend', '0021_cart_updated_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='inventory_deducted',
            field=models.BooleanField(default=False),
        ),
    ]
