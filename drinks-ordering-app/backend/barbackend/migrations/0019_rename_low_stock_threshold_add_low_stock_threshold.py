from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('barbackend', '0018_user_is_admin'),
    ]

    operations = [
        # Rename existing field low_stock_threshold -> unavailable_threshold
        migrations.RenameField(
            model_name='drink',
            old_name='low_stock_threshold',
            new_name='unavailable_threshold',
        ),
        # Add new placeholder low_stock_threshold (warning threshold, unused yet)
        migrations.AddField(
            model_name='drink',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=10, help_text='When stock falls below this (but is above unavailable_threshold), staff will be notified (future feature).'),
        ),
    ]
