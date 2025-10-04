from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('barbackend', '0025_delete_message'),
    ]

    operations = [
        # Index for Order queries by status and user
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status', 'created_at'], name='order_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['user', 'status'], name='order_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['updated_at'], name='order_updated_idx'),
        ),
        
        # Index for OrderItem lookups
        migrations.AddIndex(
            model_name='orderitem',
            index=models.Index(fields=['order', 'drink'], name='orderitem_order_drink_idx'),
        ),
        
        # Index for CartItem lookups
        migrations.AddIndex(
            model_name='cartitem',
            index=models.Index(fields=['cart', 'drink'], name='cartitem_cart_drink_idx'),
        ),
        
        # Index for Cart updated_at (for expiry checks)
        migrations.AddIndex(
            model_name='cart',
            index=models.Index(fields=['updated_at'], name='cart_updated_idx'),
        ),
        
        # Index for Drink availability queries
        migrations.AddIndex(
            model_name='drink',
            index=models.Index(fields=['available', 'category'], name='drink_avail_cat_idx'),
        ),
        
        # Index for User role queries
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role', 'is_active'], name='user_role_active_idx'),
        ),
    ]