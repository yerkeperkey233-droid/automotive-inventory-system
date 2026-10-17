import React from 'react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@components/ui/DataTable';
import { ListTableCard } from '@components/ui/ListTableCard';
import { formatDate } from '@shared/utils/formatting';
import type { StockEntry } from '../../stock.types';

interface StockTableProps {
  stocks: StockEntry[];
  onRowClick: (stock: StockEntry) => void;
  onEdit: (stock: StockEntry) => void;
  onDelete: (stock: StockEntry) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  onRowClick,
  onEdit,
  onDelete,
}) => {
  const columns = [
    { key: 'id', label: '入库编号', width: '12%', align: 'center' as const },
    { key: 'product_name', label: '商品', width: '20%', align: 'center' as const },
    {
      key: 'quantity_available',
      label: '可用数量',
      width: '15%',
      align: 'center' as const,
      render: (value: number) => <strong>{value}</strong>,
    },
    {
      key: 'quantity_received',
      label: '已收货',
      width: '12%',
      align: 'center' as const,
    },
    {
      key: 'expiration_date',
      label: '到期日期',
      width: '33%',
      align: 'center' as const,
      render: (value: string) => (value ? formatDate(value) : '暂无'),
    },
  ];

  return (
    <ListTableCard>
      <DataTable
        columns={columns}
        data={stocks}
        actionsColumnWidth={100}
        onRowClick={(row: StockEntry) => onRowClick(row)}
        renderRowActions={(row: StockEntry) => (
          <Group gap={4} wrap="nowrap" justify="center">
            <Tooltip label="编辑入库记录">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row);
                }}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="删除入库记录">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      />
    </ListTableCard>
  );
};
