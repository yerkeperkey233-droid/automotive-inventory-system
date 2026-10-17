import React from 'react';
import {
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@components/ui/DataTable';
import { OrderProductsBadges } from '@components/ui/OrderProductsBadges';
import { StatusBadge } from '@components/ui/StatusBadge';
import { formatDate, formatCurrency } from '@shared/utils/formatting';
import type { PurchaseOrder, PurchaseOrderItem } from '../../purchaseOrder.types';

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRowClick: (order: PurchaseOrder) => void;
}

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  orders,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  const renderProductsCell = (items: PurchaseOrderItem[] | undefined) => {
    if (!items?.length) {
      return '暂无';
    }

    return (
      <OrderProductsBadges
        items={items.map((item) => ({
          id: item.id,
          label: item.product?.name || item.product_name || '商品',
          quantity: item.quantity,
        }))}
        badgeColor="teal"
      />
    );
  };

  const columns = [
    { key: 'order_number', label: '订单编号', align: 'center' as const, width: '15%' },
    {
      key: 'supplier_name',
      label: '供应商',
      align: 'center' as const,
      width: '18%',
      render: (value: string) => value || '暂无',
    },
    {
      key: 'items',
      label: '商品管理',
      align: 'center' as const,
      width: '25%',
      render: (value: PurchaseOrderItem[] | undefined) => renderProductsCell(value),
    },
    {
      key: 'ordered_at',
      label: '订单日期',
      align: 'center' as const,
      width: '16%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'total_cost',
      label: '总成本',
      align: 'center' as const,
      width: '13%',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center' as const,
      width: '13%',
      render: (value: string) => <StatusBadge status={value as 'draft' | 'received' | 'cancelled'} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      actionsColumnWidth={140}
      onRowClick={(row) => onRowClick(row as PurchaseOrder)}
      renderRowActions={(row: any) => (
        <Group gap={4} wrap="nowrap" justify="center">
          <Tooltip label="编辑订单">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.id);
              }}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="删除订单">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.id);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    />
  );
};
