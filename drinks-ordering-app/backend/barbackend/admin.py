from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Drink, Order, OrderItem, Cart, CartItem


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('id',)
    list_display = ('id', 'username', 'email', 'role', 'is_staff', 'is_admin', 'is_active')
    list_filter = ('is_staff', 'is_admin', 'is_active', 'role')
    search_fields = ('username', 'email')
    list_select_related = ()  # User has no FK relations to optimize
    
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_admin', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Profile'), {'fields': ('role',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'role', 'password1', 'password2', 'is_staff', 'is_admin', 'is_superuser', 'is_active'),
        }),
    )
    readonly_fields = ('last_login', 'date_joined')
    filter_horizontal = ('groups', 'user_permissions',)


@admin.register(Drink)
class DrinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'stock', 'available', 'created_at')
    list_filter = ('available', 'category', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('available', 'stock', 'price')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('drink', 'quantity')
    can_delete = False
    
    def get_queryset(self, request):
        # Optimize inline queries
        return super().get_queryset(request).select_related('drink')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_username', 'status', 'total_price', 'inventory_deducted', 'created_at')
    list_filter = ('status', 'inventory_deducted', 'created_at')
    search_fields = ('user__username', 'user__email', 'note')
    readonly_fields = ('total_price', 'created_at', 'updated_at', 'inventory_deducted')
    list_select_related = ('user',)  # Critical: preload user data
    inlines = [OrderItemInline]
    list_per_page = 50
    
    def user_username(self, obj):
        return obj.user.username
    user_username.short_description = 'User'
    user_username.admin_order_field = 'user__username'
    
    def get_queryset(self, request):
        # Optimize the main queryset
        return super().get_queryset(request).select_related('user').prefetch_related('items__drink')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_id', 'drink_name', 'quantity')
    list_filter = ('order__status',)
    search_fields = ('order__id', 'drink__name')
    readonly_fields = ('order', 'drink', 'quantity')
    list_select_related = ('order', 'drink')  # Critical optimization
    
    def drink_name(self, obj):
        return obj.drink.name
    drink_name.short_description = 'Drink'
    drink_name.admin_order_field = 'drink__name'


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('drink', 'quantity', 'added_at')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('drink')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_username', 'item_count', 'created_at', 'updated_at')
    search_fields = ('user__username', 'note')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('user',)
    inlines = [CartItemInline]
    
    def user_username(self, obj):
        return obj.user.username
    user_username.short_description = 'User'
    user_username.admin_order_field = 'user__username'
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items__drink')