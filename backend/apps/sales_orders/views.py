from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from django.db import transaction

from apps.users.views import UserFilteredViewSet
from apps.stocks.models import StockEntry
from .models import SalesOrder, SalesOrderItem, StockAllocation
from .serializers import SalesOrderSerializer, SalesOrderItemSerializer, StockAllocationSerializer, SalesOrderCreateUpdateSerializer


class SalesOrderItemViewSet(UserFilteredViewSet):
    """API endpoint for sales order items."""
    queryset = SalesOrderItem.objects.all()
    serializer_class = SalesOrderItemSerializer
    
    def get_queryset(self):
        """Get items only from user's sales orders."""
        base_qs = SalesOrderItem.objects.filter(sales_order__user=self.request.user).select_related(
            'sales_order',
            'product',
        ).prefetch_related('allocations')
        sales_order = self.request.query_params.get('sales_order')
        product = self.request.query_params.get('product')
        statuses = self.request.query_params.get('status')
        if sales_order:
            base_qs = base_qs.filter(sales_order_id=sales_order)
        if product:
            base_qs = base_qs.filter(product_id=product)
        if statuses:
            status_values = [value.strip() for value in statuses.split(',') if value.strip()]
            if status_values:
                base_qs = base_qs.filter(sales_order__status__in=status_values)
        return base_qs.order_by('-sales_order__sold_at', '-sales_order__order_number', '-id')
    
    def perform_create(self, serializer):
        """Create item for user's sales order."""
        sales_order = serializer.validated_data.get('sales_order')
        if sales_order.user != self.request.user:
            raise PermissionError("不能为其他用户的销售订单添加明细")
        serializer.save()


class SalesOrderViewSet(UserFilteredViewSet):
    """API endpoint for managing sales orders."""
    queryset = SalesOrder.objects.prefetch_related('items__product')
    serializer_class = SalesOrderSerializer
    search_fields = ['order_number', 'customer_name', 'items__product__name', 'items__product__sku']
    ordering_fields = ['sold_at', 'status', 'order_number']
    ordering = ['-sold_at']

    def get_queryset(self):
        return super().get_queryset().distinct()
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action in ('create', 'update', 'partial_update'):
            return SalesOrderCreateUpdateSerializer
        return SalesOrderSerializer


    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """确认销售订单前必须分配库存。"""
        so = self.get_object()
        
        if so.status == 'confirmed':
            return Response(
                {'detail': '该销售订单已经确认。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'detail': '请先分配库存，再确认销售订单。'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a sales order."""
        so = self.get_object()
        
        if so.status == 'cancelled':
            return Response(
                {'message': '销售订单已经取消'},
                status=status.HTTP_200_OK
            )
        
        with transaction.atomic():
            if so.status == 'confirmed':
                StockAllocation.objects.filter(
                    user=request.user,
                    sales_order_item__sales_order=so,
                    type='sale',
                ).delete()

            so.status = 'cancelled'
            so.save()
        
        return Response(
            {'status': 'success', 'message': '销售订单已取消'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def confirm_with_allocations(self, request, pk=None):
        """Confirm sales order and allocate stock."""
        so = self.get_object()
        
        if so.status == 'confirmed':
            return Response(
                {'error': '销售订单已经确认'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sales_order_items = list(so.items.select_related('product').order_by('id'))
        if not sales_order_items:
            return Response(
                {'error': '销售订单没有可确认的明细'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allocations_data = request.data.get('allocations', [])
        if not allocations_data:
            return Response(
                {'error': '确认该销售订单前必须分配库存'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                created_allocations = []
                expected_item_ids = {item.id for item in sales_order_items}
                provided_item_ids = {
                    allocation['sales_order_item_id']
                    for allocation in allocations_data
                    if allocation.get('quantity_allocated')
                }

                if expected_item_ids != provided_item_ids:
                    raise ValueError('确认前必须为每条销售明细足额分配库存')

                for allocation_data in allocations_data:
                    sales_item = SalesOrderItem.objects.get(
                        id=allocation_data['sales_order_item_id'],
                        sales_order=so
                    )
                    stock_entry = StockEntry.objects.get(
                        id=allocation_data['stock_entry_id'],
                        user=request.user
                    )
                    
                    quantity = Decimal(str(allocation_data['quantity_allocated']))

                    if stock_entry.product_id != sales_item.product_id:
                        raise ValueError(
                            f'入库记录 #{stock_entry.id} 不属于商品 {sales_item.product.sku}.'
                        )
                    
                    if stock_entry.quantity_available < quantity:
                        raise ValueError(
                            f'入库记录库存不足，编号 #{stock_entry.id}. '
                            f'Available: {stock_entry.quantity_available}，所需数量：{quantity}'
                        )
                    
                    allocation = StockAllocation.objects.create(
                        user=request.user,
                        sales_order_item=sales_item,
                        stock_entry=stock_entry,
                        quantity_allocated=quantity,
                        type='sale',
                    )
                    created_allocations.append(allocation)

                for sales_item in sales_order_items:
                    allocated_total = sum(
                        allocation.quantity_allocated
                        for allocation in created_allocations
                        if allocation.sales_order_item_id == sales_item.id
                    )
                    if allocated_total != sales_item.quantity:
                        raise ValueError(
                            f'商品库存分配：{sales_item.product.sku}，合计必须为 {sales_item.quantity}'
                        )
                
                so.status = 'confirmed'
                so.save()
            
            return Response({
                'status': 'success',
                'message': f'{len(created_allocations)} 条库存分配记录已创建',
                'total_profit': so.total_profit,
                'allocations': StockAllocationSerializer(created_allocations, many=True).data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a confirmed sales order back to draft."""
        so = self.get_object()

        if so.status != 'confirmed':
            return Response(
                {'detail': '只有已确认的销售订单可以重新打开。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allocations = StockAllocation.objects.filter(
            user=request.user,
            sales_order_item__sales_order=so,
            type='sale',
        )
        delete_allocations = request.data.get('delete_allocations', False)

        deleted_allocations = 0
        if allocations.exists() and not delete_allocations:
            return Response(
                {
                    'detail': '该销售订单已有库存分配记录，重新打开前需删除这些记录。',
                    'requires_confirmation': True,
                    'allocation_count': allocations.count(),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if allocations.exists():
                deleted_allocations = allocations.count()
                allocations.delete()

            so.status = 'draft'
            so.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'status': 'success',
                'message': '销售订单已重新打开。',
                'deleted_allocations': deleted_allocations,
            },
            status=status.HTTP_200_OK
        )


class StockAllocationViewSet(UserFilteredViewSet):
    """API endpoint for stock allocations."""
    queryset = StockAllocation.objects.select_related('sales_order_item__sales_order', 'stock_entry')
    serializer_class = StockAllocationSerializer
    filterset_fields = ['stock_entry', 'stock_entry__product', 'type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
