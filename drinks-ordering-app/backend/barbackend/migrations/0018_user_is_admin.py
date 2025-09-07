from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("barbackend", "0017_drink_low_stock_threshold"),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_admin',
            field=models.BooleanField(default=False),
        ),
    ]
