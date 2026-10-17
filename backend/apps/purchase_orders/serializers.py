from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem
from apps.products.serializers import ProductSerializer


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'product', 'quantity',
            'unit_cost', 'total_cost', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_cost', 'created_at', 'updated_at']


class PurchaseOrderWriteItemSerializer(serializers.ModelSerializer):
    """Serializer for writing purchase order items (nested in purchase order create/update)."""
    class Meta:
        model = PurchaseOrderItem
        fields = ['product', 'quantity', 'unit_cost']

    def validate_product(self, value):
        request = self.context.get('request')
        if request and value.user_id != request.user.id:
            raise serializers.ValidationError('只能使用属于当前账号的商品。')
        return value


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    total_cost = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'user', 'supplier_name', 'order_number', 'status',
            'ordered_at', 'notes', 'total_cost', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_cost', 'items', 'created_at', 'updated_at']


class PurchaseOrderCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating purchase orders with nested items."""
    items = PurchaseOrderWriteItemSerializer(many=True, required=False)
    total_cost = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'user', 'supplier_name', 'order_number', 'status',
            'ordered_at', 'notes', 'total_cost', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_cost', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status == 'received' and 'items' in self.initial_data:
            raise serializers.ValidationError({
                'items': '采购订单收货后不能修改明细。'
            })
        return attrs
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                **item_data
            )
        
        return purchase_order
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update purchase order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(
                    purchase_order=instance,
                    **item_data
                )
        
        return instance
