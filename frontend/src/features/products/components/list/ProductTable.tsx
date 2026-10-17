import React from 'react';
import { ActionIcon, Badge, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@components/ui/DataTable';
import { ListTableCard } from '@components/ui/ListTableCard';
import { formatUnit } from '@shared/utils/formatting';
import type { Product } from '../../product.types';

interface ProductTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onRowClick,
  onEdit,
  onDelete,
}) => {
  const columns = [
    { key: 'sku', label: '商品编码', width: '20%', align: 'center' as const },
    { key: 'name', label: '名称', width: '20%', align: 'center' as const },
    {
      key: 'amount',
      label: '含量',
      width: '20%',
      align: 'center' as const,
      render: (value: number, row: Product) => `${value} ${formatUnit(row.base_unit)}`,
    },
    {
      key: 'is_active',
      label: '状态',
      width: '20%',
      align: 'center' as const,
      render: (value: boolean) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? '已启用' : '已停用'}
        </Badge>
      ),
    },
  ];

  return (
    <ListTableCard>
      <DataTable
        columns={columns}
        data={products}
        actionsColumnWidth={140}
        onRowClick={(row: Product) => onRowClick(row)}
        renderRowActions={(row: Product) => (
          <Group gap={4} wrap="nowrap" justify="center">
            <Tooltip label="编辑商品">
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
            <Tooltip label="删除商品">
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
