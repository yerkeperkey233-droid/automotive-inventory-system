import React from 'react';
import { ActionIcon, Badge, Button, Group, Menu, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconChevronDown, IconPencil, IconRotateClockwise, IconTrash, IconX } from '@tabler/icons-react';
import { formatCurrency, formatDate } from '@shared/utils/formatting';
import { normalizeStatus, getStatusLabel } from '@components/ui/StatusBadge';
import type { SalesOrder } from '../../salesOrder.types';

interface SalesOrderDetailHeaderProps {
  order: SalesOrder;
  onEdit: () => void;
  onDelete: () => void;
  onConfirm: (event?: React.MouseEvent) => void;
  onCancel: (event?: React.MouseEvent) => void;
  onReopen: (event?: React.MouseEvent) => void;
  confirmLoading?: boolean;
  cancelLoading?: boolean;
  reopenLoading?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'confirmed':
      return 'blue';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
};

export const SalesOrderDetailHeader: React.FC<SalesOrderDetailHeaderProps> = ({
  order,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  onReopen,
  confirmLoading = false,
  cancelLoading = false,
  reopenLoading = false,
}) => {
  const normalizedStatus = normalizeStatus(order.status);

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{order.order_number}</h1>
          <Text size="sm" c="dimmed">
            销售订单
          </Text>
        </Stack>
        <Group gap="xs">
          <Tooltip label="编辑订单">
            <ActionIcon size="lg" variant="light" color="blue" onClick={onEdit}>
              <IconPencil size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="删除订单">
            <ActionIcon size="lg" variant="light" color="red" onClick={onDelete}>
              <IconTrash size={20} />
            </ActionIcon>
          </Tooltip>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <Tooltip label="变更订单状态" position="top">
                <Button
                  variant="light"
                  color={getStatusColor(normalizedStatus)}
                  rightSection={<IconChevronDown size={16} />}
                  size="md"
                >
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      变更状态
                    </Text>
                    <Badge color={getStatusColor(normalizedStatus)} variant="white">
                      {getStatusLabel(normalizedStatus)}
                    </Badge>
                  </Group>
                </Button>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              {normalizedStatus === 'draft' && (
                <>
                  <Menu.Item leftSection={<IconCheck size={14} />} onClick={onConfirm} disabled={confirmLoading}>
                    确认订单
                  </Menu.Item>
                  <Menu.Item leftSection={<IconX size={14} />} color="red" onClick={onCancel} disabled={cancelLoading}>
                    取消订单
                  </Menu.Item>
                </>
              )}
              {normalizedStatus === 'confirmed' && (
                <>
                  <Menu.Item
                    leftSection={<IconRotateClockwise size={14} />}
                    onClick={onReopen}
                    disabled={reopenLoading}
                  >
                    重新打开订单
                  </Menu.Item>
                  <Menu.Item leftSection={<IconX size={14} />} color="red" onClick={onCancel} disabled={cancelLoading}>
                    取消订单
                  </Menu.Item>
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Paper p="lg" radius="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed" fw={500}>
              客户
            </Text>
            <Text fw={600}>{order.customer_name || '暂无'}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed" fw={500}>
              订单日期
            </Text>
            <Text>{formatDate(order.sold_at)}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed" fw={500}>
              总收入
            </Text>
            <Text fw={700} size="lg" c="blue">
              {formatCurrency(order.total_revenue)}
            </Text>
          </div>
        </Group>
      </Paper>
    </Stack>
  );
};
