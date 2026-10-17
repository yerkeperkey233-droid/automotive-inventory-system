from rest_framework import serializers
from .models import SalesOrder, SalesOrderItem, StockAllocation


class StockAllocationSerializer(serializers.ModelSerializer):
    sales_order_id = serializers.IntegerField(source='sales_order_item.sales_order_id', read_only=True)
    sales_order_code = serializers.CharField(source='sales_order_item.sales_order.order_number', read_only=True)

    class Meta:
        model = StockAllocation
        fields = [
            'id', 'user', 'sales_order_item', 'stock_entry',
            'sales_order_id', 'sales_order_code',
            'quantity_allocated', 'type', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if instance and 'stock_entry' in attrs and attrs['stock_entry'] != instance.stock_entry:
            raise serializers.ValidationError({
                'stock_entry': '不能更改现有分配关联的入库记录。'
            })

        if instance and 'sales_order_item' in attrs and attrs['sales_order_item'] != instance.sales_order_item:
            raise serializers.ValidationError({
                'sales_order_item': '不能更改现有分配关联的销售订单明细。'
            })

        stock_entry = attrs.get('stock_entry', instance.stock_entry if instance else None)
        sales_order_item = attrs.get('sales_order_item', instance.sales_order_item if instance else None)
        allocation_type = attrs.get('type', instance.type if instance else 'sale')
        quantity_allocated = attrs.get(
            'quantity_allocated',
            instance.quantity_allocated if instance else None,
        )

        if stock_entry is None or quantity_allocated is None:
            return attrs

        if user and stock_entry.user_id != user.id:
            raise serializers.ValidationError({
                'stock_entry': '只能分配属于当前账号的库存。'
            })

        if sales_order_item and user and sales_order_item.sales_order.user_id != user.id:
            raise serializers.ValidationError({
                'sales_order_item': '只能分配给属于当前账号的销售订单明细。'
            })

        current_quantity = instance.quantity_allocated if instance else 0
        available_for_update = stock_entry.quantity_available + current_quantity
        if quantity_allocated > available_for_update:
            raise serializers.ValidationError({
                'quantity_allocated': (
                    f'分配数量不能超过 {available_for_update}（当前入库记录）。'
                )
            })

        if sales_order_item and allocation_type != 'sale':
            raise serializers.ValidationError({
                'type': '关联销售订单的分配必须保持销售出库类型。'
            })

        if allocation_type == 'sale' and not sales_order_item:
            raise serializers.ValidationError({
                'type': '销售出库分配必须关联销售订单明细。'
            })

        if sales_order_item:
            if stock_entry.product_id != sales_order_item.product_id:
                raise serializers.ValidationError({
                    'stock_entry': '入库记录与销售订单明细必须对应同一商品。'
                })
            sibling_allocations = sales_order_item.allocations.exclude(
                pk=instance.pk if instance else None
            )
            sibling_total = sum(
                allocation.quantity_allocated for allocation in sibling_allocations
            )
            if sibling_total + quantity_allocated > sales_order_item.quantity:
                raise serializers.ValidationError({
                    'quantity_allocated': (
                        f'分配数量超过销售订单明细数量：{sales_order_item.quantity}.'
                    )
                })

        return attrs


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    sales_order_code = serializers.CharField(source='sales_order.order_number', read_only=True)
    total_cost = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    profit = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    margin_percent = serializers.DecimalField(
        read_only=True,
        max_digits=5,
        decimal_places=2
    )
    allocations = serializers.SerializerMethodField()
    
    class Meta:
        model = SalesOrderItem
        fields = [
            'id', 'sales_order', 'sales_order_code', 'product', 'product_name', 'quantity', 'unit_price',
            'total_revenue', 'total_cost', 'profit', 'margin_percent',
            'allocations', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_revenue', 'total_cost', 'profit', 'margin_percent', 'allocations', 'created_at', 'updated_at']
    
    def get_allocations(self, obj):
        allocations = obj.allocations.all()
        return StockAllocationSerializer(allocations, many=True).data


class SalesOrderWriteItemSerializer(serializers.ModelSerializer):
    """Serializer for writing sales order items (nested in sales order create/update)."""
    class Meta:
        model = SalesOrderItem
        fields = ['product', 'quantity', 'unit_price']

    def validate_product(self, value):
        request = self.context.get('request')
        if request and value.user_id != request.user.id:
            raise serializers.ValidationError('只能使用属于当前账号的商品。')
        return value


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, read_only=True)
    total_revenue = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    total_cost = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    total_profit = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'user', 'order_number', 'customer_name', 'status',
            'sold_at', 'notes', 'total_revenue', 'total_cost',
            'total_profit', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_revenue', 'total_cost', 'total_profit', 'items', 'created_at', 'updated_at']


class SalesOrderCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating sales orders with nested items."""
    items = SalesOrderWriteItemSerializer(many=True, required=False)
    total_revenue = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    total_cost = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    total_profit = serializers.DecimalField(
        read_only=True,
        max_digits=15,
        decimal_places=2
    )
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'user', 'order_number', 'customer_name', 'status',
            'sold_at', 'notes', 'total_revenue', 'total_cost',
            'total_profit', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_revenue', 'total_cost', 'total_profit', 'created_at', 'updated_at']

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.status == 'confirmed' and 'items' in self.initial_data:
            raise serializers.ValidationError({
                'items': '销售订单确认后不能修改明细。'
            })
        return attrs
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        sales_order = SalesOrder.objects.create(**validated_data)
        
        for item_data in items_data:
            SalesOrderItem.objects.create(
                sales_order=sales_order,
                **item_data
            )
        
        return sales_order
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update sales order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SalesOrderItem.objects.create(
                    sales_order=instance,
                    **item_data
                )

        return instance
