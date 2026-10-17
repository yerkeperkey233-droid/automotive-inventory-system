import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { IconAlertCircle, IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { DataTable } from '@components/ui/DataTable';
import { ROUTES } from '@/app/router/route-paths';
import { formatDate, formatNumber } from '@shared/utils/formatting';
import { useDeleteStockAllocation, useUpdateStockAllocation } from '../../stocks.hooks';
import type { StockAllocation, StockEntry, UpdateStockAllocationPayload } from '../../stock.types';

interface StockAllocationsByProductCardProps {
  allocations: StockAllocation[];
  entries: StockEntry[];
  quantityDecimals: number;
}

const allocationTypeColors: Record<StockAllocation['type'], string> = {
  sale: 'blue',
  expired: 'orange',
  other: 'gray',
};

export const StockAllocationsByProductCard: React.FC<StockAllocationsByProductCardProps> = ({
  allocations,
  entries,
  quantityDecimals,
}) => {
  const updateAllocationMutation = useUpdateStockAllocation();
  const deleteAllocationMutation = useDeleteStockAllocation();
  const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
  const [editingAllocation, setEditingAllocation] = useState<StockAllocation | null>(null);
  const [deletingAllocation, setDeletingAllocation] = useState<StockAllocation | null>(null);
  const [quantityAllocated, setQuantityAllocated] = useState<number | string>(0);
  const [allocationType, setAllocationType] = useState<StockAllocation['type']>('other');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingAllocation) {
      return;
    }

    setQuantityAllocated(Number(editingAllocation.quantity_allocated));
    setAllocationType(editingAllocation.type);
    setNotes(editingAllocation.notes || '');
    setFormError(null);
  }, [editingAllocation]);

  const editableQuantityMax = useMemo(() => {
    if (!editingAllocation) {
      return 0;
    }

    const entry = entryMap.get(editingAllocation.stock_entry);
    if (!entry) {
      return Number(editingAllocation.quantity_allocated);
    }

    return Number(entry.quantity_available) + Number(editingAllocation.quantity_allocated);
  }, [editingAllocation, entryMap]);

  const resetEditState = () => {
    setEditingAllocation(null);
    setFormError(null);
  };

  const resetDeleteState = () => {
    setDeletingAllocation(null);
    setDeleteError(null);
  };

  const extractErrorMessage = (error: unknown) => {
    const axiosError = error as AxiosError<{
      detail?: string;
      error?: string;
      [key: string]: unknown;
    }>;
    const responseData = axiosError.response?.data;
    if (!responseData) {
      return '更新库存分配失败。';
    }

    if (typeof responseData.detail === 'string') {
      return responseData.detail;
    }

    if (typeof responseData.error === 'string') {
      return responseData.error;
    }

    const firstValue = Object.values(responseData)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
      return firstValue[0];
    }

    if (typeof firstValue === 'string') {
      return firstValue;
    }

    return '更新库存分配失败。';
  };

  const handleSave = async () => {
    if (!editingAllocation) {
      return;
    }

    const parsedQuantity =
      typeof quantityAllocated === 'number' ? quantityAllocated : Number(quantityAllocated);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setFormError('数量必须大于 0。');
      return;
    }

    if (parsedQuantity - editableQuantityMax > 0.0001) {
      setFormError(`数量不能超过 ${formatNumber(editableQuantityMax, quantityDecimals)}。`);
      return;
    }

    if (editingAllocation.sales_order_item && allocationType !== 'sale') {
      setFormError('关联销售订单的分配必须保持销售出库类型。');
      return;
    }

    const payload: UpdateStockAllocationPayload = {
      quantity_allocated: parsedQuantity,
      type: allocationType,
      notes: notes.trim() || null,
    };

    try {
      await updateAllocationMutation.mutateAsync({
        id: editingAllocation.id,
        payload,
      });
      resetEditState();
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingAllocation) {
      return;
    }

    try {
      await deleteAllocationMutation.mutateAsync(deletingAllocation.id);
      resetDeleteState();
    } catch (error) {
      setDeleteError(extractErrorMessage(error));
    }
  };

  const columns = [
    {
      key: 'stock_entry',
      label: '入库记录',
      width: '16%',
      align: 'center' as const,
      render: (value: number) => entryMap.get(value)?.stock_identifier || `入库记录 #${value}`,
    },
    {
      key: 'source',
      label: '来源',
      width: '18%',
      align: 'center' as const,
      render: (_value: string | undefined, row: StockAllocation) => (
        row.type === 'sale' && row.sales_order_id && row.sales_order_code ? (
          <Anchor component={Link} to={ROUTES.salesOrderDetail(row.sales_order_id)}>
            {row.sales_order_code}
          </Anchor>
        ) : (
          <Badge color={allocationTypeColors[row.type]} variant="light">
            {{ sale: '销售出库', expired: '过期损耗', other: '其他' }[row.type]}
          </Badge>
        )
      ),
    },
    {
      key: 'quantity_allocated',
      label: '数量',
      width: '16%',
      align: 'center' as const,
      render: (value: number | string) => <strong>{formatNumber(value, quantityDecimals)}</strong>,
    },
    {
      key: 'notes',
      label: '备注',
      width: '25%',
      align: 'center' as const,
      render: (value: string | null | undefined) => value || '暂无',
    },
    {
      key: 'created_at',
      label: '创建时间',
      width: '25%',
      align: 'center' as const,
      render: (value: string) => formatDate(value),
    },
  ];

  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={700} size="lg">
              库存分配
            </Text>
            {/* <Text size="sm" c="dimmed">
              该商品的全部库存使用记录
            </Text> */}
          </Stack>
          <Badge variant="light">{allocations.length} 条分配记录</Badge>
        </Group>

        {allocations.length === 0 ? (
          <Text c="dimmed">该商品暂无库存分配记录。</Text>
        ) : (
          <DataTable
            columns={columns}
            data={allocations}
            actionsColumnWidth={110}
            tableMinWidth={900}
            renderRowActions={(row: StockAllocation) => (
              <Group gap={4} wrap="nowrap" justify="center">
                <Tooltip label="编辑库存分配">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => setEditingAllocation(row)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="删除库存分配">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => setDeletingAllocation(row)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          />
        )}
      </Stack>

      <Modal
        opened={!!editingAllocation}
        onClose={resetEditState}
        title="编辑库存分配"
        centered
      >
        <Stack gap="md">
          {formError ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {formError}
            </Alert>
          ) : null}

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              入库记录
            </Text>
            <Text size="sm" c="dimmed">
              {editingAllocation
                ? entryMap.get(editingAllocation.stock_entry)?.stock_identifier ||
                  `入库记录 #${editingAllocation.stock_entry}`
                : '暂无'}
            </Text>
          </Stack>

          <NumberInput
            label="数量"
            value={quantityAllocated}
            onChange={setQuantityAllocated}
            min={0}
            max={editableQuantityMax}
            decimalScale={quantityDecimals}
            step={quantityDecimals === 0 ? 1 : 0.01}
            disabled={updateAllocationMutation.isPending}
          />

          <Select
            label="类型"
            data={[
              { value: 'sale', label: '销售出库' },
              { value: 'expired', label: '过期损耗' },
              { value: 'other', label: '其他' },
            ]}
            value={allocationType}
            onChange={(value) => {
              if (value) {
                setAllocationType(value as StockAllocation['type']);
              }
            }}
            disabled={!!editingAllocation?.sales_order_item || updateAllocationMutation.isPending}
          />

          {editingAllocation?.sales_order_item ? (
            <Text size="xs" c="dimmed">
              关联销售订单的分配必须保持销售出库类型，以确保库存和利润记录一致。
            </Text>
          ) : null}

          <Textarea
            label="备注"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            minRows={3}
            autosize
            disabled={updateAllocationMutation.isPending}
          />

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={resetEditState}
              disabled={updateAllocationMutation.isPending}
            >
              取消
            </Button>
            <Button onClick={handleSave} loading={updateAllocationMutation.isPending}>
              保存修改
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!deletingAllocation}
        onClose={resetDeleteState}
        title="删除库存分配"
        centered
      >
        <Stack gap="md">
          {deleteError ? (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {deleteError}
            </Alert>
          ) : null}

          <Text>
            确定删除该库存分配吗？
          </Text>

          {deletingAllocation ? (
            <Text size="sm" c="dimmed">
              {entryMap.get(deletingAllocation.stock_entry)?.stock_identifier ||
                `入库记录 #${deletingAllocation.stock_entry}`}:
              {' '}
              {formatNumber(deletingAllocation.quantity_allocated, quantityDecimals)}
            </Text>
          ) : null}

          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={resetDeleteState}
              disabled={deleteAllocationMutation.isPending}
            >
              取消
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={deleteAllocationMutation.isPending}
            >
              删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
};
