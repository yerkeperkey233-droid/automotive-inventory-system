import React from 'react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@components/ui/DataTable';
import { OrderProductsBadges } from '@components/ui/OrderProductsBadges';
import { StatusBadge } from '@components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@shared/utils/formatting';
import type { SalesOrder, SalesOrderItem } from '../../salesOrder.types';

interface SalesOrdersTableProps {
  orders: SalesOrder[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRowClick: (order: SalesOrder) => void;
}

export const SalesOrdersTable: React.FC<SalesOrdersTableProps> = ({
  orders,
  onEdit,
  onDelete,
  onRowClick,
}) => {
  const renderProductsCell = (items: SalesOrderItem[] | undefined) => {
    if (!items?.length) {
      return '暂无';
    }

    return (
      <OrderProductsBadges
        items={items.map((item) => ({
          id: item.id,
          label: item.product_name || `商品 #${item.product}`,
          quantity: item.quantity,
        }))}
        badgeColor="grape"
      />
    );
  };

  const columns = [
    { key: 'order_number', label: '订单编号', align: 'center' as const, width: '15%' },
    {
      key: 'customer_name',
      label: '客户',
      align: 'center' as const,
      width: '18%',
      render: (value: string) => value || '暂无',
    },
    {
      key: 'items',
      label: '商品管理',
      align: 'center' as const,
      width: '25%',
      render: (value: SalesOrderItem[] | undefined) => renderProductsCell(value),
    },
    {
      key: 'sold_at',
      label: '订单日期',
      align: 'center' as const,
      width: '16%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'total_revenue',
      label: '收入',
      align: 'center' as const,
      width: '13%',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center' as const,
      width: '13%',
      render: (value: string) => <StatusBadge status={value as 'draft' | 'cancelled'} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      actionsColumnWidth={140}
      onRowClick={(row) => onRowClick(row as SalesOrder)}
      renderRowActions={(row: SalesOrder) => (
        <Group gap={4} wrap="nowrap" justify="center">
          <Tooltip label="编辑订单">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={(event) => {
                event.stopPropagation();
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
              onClick={(event) => {
                event.stopPropagation();
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
