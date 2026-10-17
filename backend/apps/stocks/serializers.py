from rest_framework import serializers
from .models import StockEntry


class StockEntrySerializer(serializers.ModelSerializer):
    quantity_available = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=4
    )
    quantity_sold = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=4
    )
    purchase_order_id = serializers.SerializerMethodField()
    purchase_order_number = serializers.SerializerMethodField()

    def get_purchase_order_id(self, obj):
        if obj.source_type != 'purchase_order' or not obj.source_reference_id:
            return None

        from apps.purchase_orders.models import PurchaseOrderItem

        po_item = (
            PurchaseOrderItem.objects
            .filter(id=obj.source_reference_id, purchase_order__user=obj.user)
            .select_related('purchase_order')
            .first()
        )
        return po_item.purchase_order_id if po_item else None

    def get_purchase_order_number(self, obj):
        if obj.source_type != 'purchase_order' or not obj.source_reference_id:
            return None

        from apps.purchase_orders.models import PurchaseOrderItem

        po_item = (
            PurchaseOrderItem.objects
            .filter(id=obj.source_reference_id, purchase_order__user=obj.user)
            .select_related('purchase_order')
            .first()
        )
        return po_item.purchase_order.order_number if po_item else None

    def validate(self, attrs):
        instance = self.instance

        if instance and 'source_type' in attrs and attrs['source_type'] != instance.source_type:
            raise serializers.ValidationError({
                'source_type': '不能更改现有入库记录的来源类型。'
            })

        return attrs

    class Meta:
        model = StockEntry
        fields = [
            'id', 'user', 'product', 'stock_identifier', 'source_type',
            'source_reference_id', 'quantity_received', 'quantity_available',
            'quantity_sold', 'received_at',
            'expiration_date', 'notes', 'purchase_order_id', 'purchase_order_number',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'stock_identifier', 'quantity_available', 'quantity_sold',
            'purchase_order_id', 'purchase_order_number',
            'created_at', 'updated_at'
        ]
