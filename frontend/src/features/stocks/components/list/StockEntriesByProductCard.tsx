import React from 'react';
import { ActionIcon, Anchor, Badge, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { DataTable } from '@components/ui/DataTable';
import { formatDate, formatNumber } from '@shared/utils/formatting';
import { ROUTES } from '@/app/router/route-paths';
import type { StockEntry } from '../../stock.types';

interface StockEntriesByProductCardProps {
  entries: StockEntry[];
  onEdit: (entry: StockEntry) => void;
  onDelete: (entry: StockEntry) => void;
}

export const StockEntriesByProductCard: React.FC<StockEntriesByProductCardProps> = ({
  entries,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      key: 'stock_identifier',
      label: '入库编号',
      width: '12%',
      align: 'center' as const,
      render: (value: number | string) => <strong>{value}</strong>,
    },
    {
      key: 'source_type',
      label: '来源',
      width: '20%',
      align: 'center' as const,
      render: (value: string, row: StockEntry) => (
        <Stack gap={4} align="center">
          {value === 'manual' ? (
            <Badge variant="light" color="gray">
              手工入库
            </Badge>
          ) : null}
          {value === 'purchase_order' && row.purchase_order_id ? (
            <Anchor
              component={Link}
              to={ROUTES.purchaseOrderDetail(row.purchase_order_id)}
              size="sm"
              onClick={(event) => event.stopPropagation()}
            >
              {row.purchase_order_number || `采购订单 #${row.purchase_order_id}`}
            </Anchor>
          ) : null}
        </Stack>
      ),
    },
    {
      key: 'quantity_available',
      label: '可用数量',
      width: '14%',
      align: 'center' as const,
      render: (value: number | string) => <strong>{formatNumber(value)}</strong>,
    },
    {
      key: 'quantity_received',
      label: '已收货',
      width: '14%',
      align: 'center' as const,
      render: (value: number | string) => formatNumber(value),
    },
    {
      key: 'received_at',
      label: '收货日期',
      width: '20%',
      align: 'center' as const,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'expiration_date',
      label: '到期日期',
      width: '20%',
      align: 'center' as const,
      render: (value: string | undefined) => (value ? formatDate(value) : '暂无'),
    },
  ];

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={700} size="lg">
              入库记录
            </Text>
            {/* <Text size="sm" c="dimmed">
              该商品的全部入库记录
            </Text> */}
          </Stack>
          <Badge variant="light">{entries.length} 条入库记录</Badge>
        </Group>

        {entries.length === 0 ? (
          <Text c="dimmed">该商品暂无入库记录。</Text>
        ) : (
          <DataTable
            columns={columns}
            data={entries}
            actionsColumnWidth={110}
            tableMinWidth={900}
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
        )}
      </Stack>
    </Paper>
  );
};
