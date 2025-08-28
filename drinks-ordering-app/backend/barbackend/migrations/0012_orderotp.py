from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('barbackend', '0011_alter_drink_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderOTP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code_hash', models.CharField(max_length=128)),
                ('code_plain', models.CharField(max_length=10)),
                ('expires_at', models.DateTimeField()),
                ('last_sent_at', models.DateTimeField(blank=True, null=True)),
                ('is_used', models.BooleanField(default=False)),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('max_attempts', models.PositiveSmallIntegerField(default=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='otp', to='barbackend.order')),
            ],
        ),
    ]
