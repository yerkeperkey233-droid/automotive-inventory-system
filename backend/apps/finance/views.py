from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Q
from django.utils.dateparse import parse_date

from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.products.models import Product
from apps.purchase_orders.models import PurchaseOrderItem
from apps.sales_orders.models import StockAllocation

from .serializers import (
    FinancialMetricsSerializer,
    ProductFinancialItemSerializer,
    PurchaseItemFinancialItemSerializer,
)


VALID_PURCHASE_STATUSES = ('received',)
VALID_SALES_STATUSES = ('confirmed', 'delivered')
ZERO_MONEY = Decimal('0.00')
ZERO_QTY = Decimal('0.0000')


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def quantity(value: Decimal) -> Decimal:
    return value.quantize(Decimal('0.0000'), rounding=ROUND_HALF_UP)


def calculate_margin(profit: Decimal, total_cogs: Decimal):
    if total_cogs <= 0:
        return None
    return money((profit / total_cogs) * Decimal('100'))


def parse_ids(raw_ids: str | None):
    if not raw_ids:
        return None

    try:
        return {
            int(item.strip())
            for item in raw_ids.split(',')
            if item.strip()
        }
    except ValueError as exc:
        raise ValidationError({'ids': '请提供以逗号分隔的整数编号列表。'}) from exc


def parse_period(start_date_raw: str | None, end_date_raw: str | None):
    start_date = parse_date(start_date_raw) if start_date_raw else None
    end_date = parse_date(end_date_raw) if end_date_raw else None

    if start_date_raw and start_date is None:
        raise ValidationError({'start_date': '日期格式必须为 YYYY-MM-DD。'})

    if end_date_raw and end_date is None:
        raise ValidationError({'end_date': '日期格式必须为 YYYY-MM-DD。'})

    if start_date and end_date and start_date > end_date:
        raise ValidationError({'end_date': '结束日期不能早于开始日期。'})

    return start_date, end_date


def build_summary(items: list[dict], include_quantity_remaining: bool = True) -> dict:
    total_revenue = sum((item['total_revenue'] for item in items), ZERO_MONEY)
    total_purchase_cost = sum((item['total_purchase_cost'] for item in items), ZERO_MONEY)
    total_cogs = sum((item['total_cogs'] for item in items), ZERO_MONEY)
    profit = total_revenue - total_cogs
    quantity_purchased_total = sum(
        (
            item['quantity_purchased']
            for item in items
            if item['quantity_purchased'] is not None
        ),
        ZERO_QTY,
    )
    quantity_sold_total = sum(
        (
            item['quantity_sold']
            for item in items
            if item['quantity_sold'] is not None
        ),
        ZERO_QTY,
    )
    quantity_remaining_total = sum(
        (
            item['quantity_remaining']
            for item in items
            if item['quantity_remaining'] is not None
        ),
        ZERO_QTY,
    )

    return {
        'total_revenue': money(total_revenue),
        'total_purchase_cost': money(total_purchase_cost),
        'total_cogs': money(total_cogs),
        'profit': money(profit),
        'profit_margin': calculate_margin(profit, total_cogs),
        'quantity_purchased': quantity(quantity_purchased_total),
        'quantity_sold': quantity(quantity_sold_total),
        'quantity_remaining': quantity(quantity_remaining_total) if include_quantity_remaining else None,
    }

class BaseFinancialViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    item_serializer_class = FinancialMetricsSerializer
    include_quantity_remaining = True

    def list(self, request):
        selected_ids = parse_ids(request.query_params.get('ids'))
        search = (request.query_params.get('search') or '').strip()
        start_date, end_date = parse_period(
            request.query_params.get('start_date'),
            request.query_params.get('end_date'),
        )
        items = self.get_items(
            user=request.user,
            selected_ids=selected_ids,
            search=search,
            start_date=start_date,
            end_date=end_date,
        )
        summary = build_summary(items, include_quantity_remaining=self.include_quantity_remaining)

        return Response({
            'summary': FinancialMetricsSerializer(summary).data,
            'items': self.item_serializer_class(items, many=True).data,
        })

    def get_items(self, user, selected_ids=None, search='', start_date=None, end_date=None):
        raise NotImplementedError


class ProductFinancialViewSet(BaseFinancialViewSet):
    item_serializer_class = ProductFinancialItemSerializer

    def get_items(self, user, selected_ids=None, search='', start_date=None, end_date=None):
        products = Product.objects.filter(user=user).order_by('name', 'sku', 'id')
        if selected_ids is not None:
            products = products.filter(id__in=selected_ids)
        if search:
            products = products.filter(Q(name__icontains=search) | Q(sku__icontains=search))

        purchase_items = PurchaseOrderItem.objects.filter(
            purchase_order__user=user,
            purchase_order__status__in=VALID_PURCHASE_STATUSES,
        ).select_related('product')
        if start_date:
            purchase_items = purchase_items.filter(purchase_order__ordered_at__date__gte=start_date)
        if end_date:
            purchase_items = purchase_items.filter(purchase_order__ordered_at__date__lte=end_date)
        if selected_ids is not None:
            purchase_items = purchase_items.filter(product_id__in=selected_ids)
        if search:
            purchase_items = purchase_items.filter(
                Q(product__name__icontains=search) | Q(product__sku__icontains=search)
            )

        allocations = StockAllocation.objects.filter(
            user=user,
            type='sale',
            sales_order_item__sales_order__status__in=VALID_SALES_STATUSES,
            stock_entry__product__user=user,
        ).select_related('stock_entry__product', 'sales_order_item')
        if start_date:
            allocations = allocations.filter(sales_order_item__sales_order__sold_at__date__gte=start_date)
        if end_date:
            allocations = allocations.filter(sales_order_item__sales_order__sold_at__date__lte=end_date)
        if selected_ids is not None:
            allocations = allocations.filter(stock_entry__product_id__in=selected_ids)
        if search:
            allocations = allocations.filter(
                Q(stock_entry__product__name__icontains=search)
                | Q(stock_entry__product__sku__icontains=search)
            )

        purchase_by_product = {}
        for item in purchase_items:
            metrics = purchase_by_product.setdefault(
                item.product_id,
                {
                    'quantity_purchased': ZERO_QTY,
                    'total_purchase_cost': ZERO_MONEY,
                },
            )
            metrics['quantity_purchased'] += item.quantity
            metrics['total_purchase_cost'] += item.total_cost

        sales_by_product = {}
        for allocation in allocations:
            product_id = allocation.stock_entry.product_id
            metrics = sales_by_product.setdefault(
                product_id,
                {
                    'quantity_sold': ZERO_QTY,
                    'total_revenue': ZERO_MONEY,
                    'total_cogs': ZERO_MONEY,
                },
            )
            revenue = (
                allocation.sales_order_item.total_revenue * allocation.quantity_allocated
                / allocation.sales_order_item.quantity
                if allocation.sales_order_item.quantity > 0 else ZERO_MONEY
            )
            metrics['quantity_sold'] += allocation.quantity_allocated
            metrics['total_revenue'] += revenue
            metrics['total_cogs'] += allocation.quantity_allocated * allocation.stock_entry.effective_unit_cost

        items = []
        for product in products:
            purchase_metrics = purchase_by_product.get(product.id, {})
            sales_metrics = sales_by_product.get(product.id, {})
            total_revenue = money(sales_metrics.get('total_revenue', ZERO_MONEY))
            total_purchase_cost = money(purchase_metrics.get('total_purchase_cost', ZERO_MONEY))
            total_cogs = money(sales_metrics.get('total_cogs', ZERO_MONEY))
            profit = total_revenue - total_cogs
            quantity_purchased_value = quantity(purchase_metrics.get('quantity_purchased', ZERO_QTY))
            quantity_sold_value = quantity(sales_metrics.get('quantity_sold', ZERO_QTY))
            quantity_remaining_value = quantity(quantity_purchased_value - quantity_sold_value)

            items.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'base_unit': product.base_unit,
                'total_revenue': total_revenue,
                'total_purchase_cost': total_purchase_cost,
                'total_cogs': total_cogs,
                'profit': money(profit),
                'profit_margin': calculate_margin(profit, total_cogs),
                'quantity_purchased': quantity_purchased_value,
                'quantity_sold': quantity_sold_value,
                'quantity_remaining': quantity_remaining_value,
            })

        return items


class PurchaseItemFinancialViewSet(BaseFinancialViewSet):
    item_serializer_class = PurchaseItemFinancialItemSerializer

    def get_items(self, user, selected_ids=None, search='', start_date=None, end_date=None):
        purchase_items = PurchaseOrderItem.objects.filter(
            purchase_order__user=user,
            purchase_order__status__in=VALID_PURCHASE_STATUSES,
        ).select_related('purchase_order', 'product').order_by(
            'purchase_order__ordered_at',
            'purchase_order__order_number',
            'id',
        )
        if start_date:
            purchase_items = purchase_items.filter(purchase_order__ordered_at__date__gte=start_date)
        if end_date:
            purchase_items = purchase_items.filter(purchase_order__ordered_at__date__lte=end_date)
        if selected_ids is not None:
            purchase_items = purchase_items.filter(id__in=selected_ids)
        if search:
            purchase_items = purchase_items.filter(
                Q(purchase_order__order_number__icontains=search)
                | Q(product__name__icontains=search)
                | Q(product__sku__icontains=search)
            )

        purchase_item_ids = [item.id for item in purchase_items]
        allocations = StockAllocation.objects.filter(
            user=user,
            type='sale',
            sales_order_item__sales_order__status__in=VALID_SALES_STATUSES,
            stock_entry__source_type='purchase_order',
            stock_entry__source_reference_id__in=purchase_item_ids,
        ).select_related('stock_entry', 'sales_order_item')
        if start_date:
            allocations = allocations.filter(sales_order_item__sales_order__sold_at__date__gte=start_date)
        if end_date:
            allocations = allocations.filter(sales_order_item__sales_order__sold_at__date__lte=end_date)

        sold_metrics = {}
        for allocation in allocations:
            purchase_item_id = allocation.stock_entry.source_reference_id
            metrics = sold_metrics.setdefault(
                purchase_item_id,
                {
                    'quantity_sold': ZERO_QTY,
                    'total_revenue': ZERO_MONEY,
                    'total_cogs': ZERO_MONEY,
                },
            )
            revenue = (
                allocation.sales_order_item.total_revenue * allocation.quantity_allocated
                / allocation.sales_order_item.quantity
                if allocation.sales_order_item.quantity > 0 else ZERO_MONEY
            )
            metrics['quantity_sold'] += allocation.quantity_allocated
            metrics['total_revenue'] += revenue
            metrics['total_cogs'] += allocation.quantity_allocated * allocation.stock_entry.effective_unit_cost

        items = []
        for purchase_item in purchase_items:
            sales_metrics = sold_metrics.get(purchase_item.id, {})
            total_revenue = money(sales_metrics.get('total_revenue', ZERO_MONEY))
            total_purchase_cost = money(purchase_item.total_cost)
            total_cogs = money(sales_metrics.get('total_cogs', ZERO_MONEY))
            profit = total_revenue - total_cogs
            quantity_sold_value = quantity(sales_metrics.get('quantity_sold', ZERO_QTY))
            quantity_remaining_value = quantity(purchase_item.quantity - quantity_sold_value)
            remaining_value = money(quantity_remaining_value * purchase_item.unit_cost)

            items.append({
                'id': purchase_item.id,
                'name': f"{purchase_item.purchase_order.order_number} · {purchase_item.product.name}",
                'order_number': purchase_item.purchase_order.order_number,
                'product_name': purchase_item.product.name,
                'product_sku': purchase_item.product.sku,
                'base_unit': purchase_item.product.base_unit,
                'unit_cost': money(purchase_item.unit_cost),
                'remaining_value': remaining_value,
                'total_revenue': total_revenue,
                'total_purchase_cost': total_purchase_cost,
                'total_cogs': total_cogs,
                'profit': money(profit),
                'profit_margin': calculate_margin(profit, total_cogs),
                'quantity_purchased': quantity(purchase_item.quantity),
                'quantity_sold': quantity_sold_value,
                'quantity_remaining': quantity_remaining_value,
            })

        return items
