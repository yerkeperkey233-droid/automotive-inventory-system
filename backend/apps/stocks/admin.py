from django.contrib import admin
from .models import StockEntry


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'stock_identifier', 'user', 'product', 'quantity_available', 'received_at')
    list_filter = ('source_type', 'received_at', 'user')
    search_fields = ('id', 'stock_identifier', 'product__sku', 'product__name')
    readonly_fields = ('stock_identifier', 'created_at', 'updated_at', 'quantity_available', 'quantity_sold')
    fieldsets = (
        ('User & Ownership', {
            'fields': ('user',)
        }),
        ('Stock Information', {
            'fields': ('stock_identifier', 'product', 'source_type', 'source_reference_id')
        }),
        ('Quantities', {
            'fields': ('quantity_received', 'quantity_available', 'quantity_sold')
        }),
        ('Dates & Expiration', {
            'fields': ('received_at', 'expiration_date')
        }),
        ('备注', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
