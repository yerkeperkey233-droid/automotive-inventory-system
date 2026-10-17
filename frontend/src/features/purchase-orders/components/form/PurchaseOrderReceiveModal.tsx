import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconAlertCircle, IconPlus, IconTrash } from '@tabler/icons-react';
import { formatDate, formatNumber } from '@shared/utils/formatting';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  ReceivePurchaseOrderEntriesPayload,
} from '../../purchaseOrder.types';

interface ReceiveEntryDraft {
  id: string;
  quantity_received: number;
  expiration_date: string;
}

interface PurchaseOrderReceiveModalProps {
  opened: boolean;
  order: PurchaseOrder;
  onClose: () => void;
  onConfirm: (payload: ReceivePurchaseOrderEntriesPayload) => Promise<void>;
  isLoading?: boolean;
}

const createDraftEntry = (quantity_received = 0): ReceiveEntryDraft => ({
  id: `${Date.now()}-${Math.random()}`,
  quantity_received,
  expiration_date: '',
});

export const PurchaseOrderReceiveModal: React.FC<PurchaseOrderReceiveModalProps> = ({
  opened,
  order,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [entriesByItem, setEntriesByItem] = useState<Record<number, ReceiveEntryDraft[]>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const getProductLabel = (item: PurchaseOrderItem) => {
    if (item.product && typeof item.product === 'object' && 'name' in item.product) {
      return item.product.name;
    }
    return item.product_name || '未知商品';
  };

  const items = useMemo(() => order.items || [], [order.items]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const initialEntries: Record<number, ReceiveEntryDraft[]> = {};
    items.forEach((item) => {
      initialEntries[item.id] = [createDraftEntry(Number(item.quantity))];
    });
    setEntriesByItem(initialEntries);
    setValidationError(null);
  }, [opened, items]);

  const updateItemEntries = (itemId: number, updater: (current: ReceiveEntryDraft[]) => ReceiveEntryDraft[]) => {
    setEntriesByItem((current) => ({
      ...current,
      [itemId]: updater(current[itemId] || []),
    }));
  };

  const handleEntryChange = (
    itemId: number,
    entryId: string,
    field: keyof Omit<ReceiveEntryDraft, 'id'>,
    value: string | number
  ) => {
    updateItemEntries(itemId, (current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              [field]:
                field === 'quantity_received'
                  ? typeof value === 'number'
                    ? value
                    : Number(value) || 0
                  : String(value || ''),
            }
          : entry
      )
    );
  };

  const handleAddEntry = (itemId: number) => {
    updateItemEntries(itemId, (current) => [...current, createDraftEntry()]);
  };

  const handleRemoveEntry = (itemId: number, entryId: string) => {
    updateItemEntries(itemId, (current) => current.filter((entry) => entry.id !== entryId));
  };

  const handleSubmit = async () => {
    const payloadEntries: ReceivePurchaseOrderEntriesPayload['entries'] = [];

    for (const item of items) {
      const itemEntries = entriesByItem[item.id] || [];
      const totalReceived = itemEntries.reduce((sum, entry) => sum + entry.quantity_received, 0);

      if (Math.abs(totalReceived - Number(item.quantity)) > 0.0001) {
        setValidationError(
          `${getProductLabel(item)} 的入库数量合计必须为 ${formatNumber(item.quantity, 4)}。`
        );
        return;
      }

      for (const entry of itemEntries) {
        if (entry.quantity_received <= 0) {
          setValidationError(`${getProductLabel(item)} 的所有入库数量必须大于 0。`);
          return;
        }

        payloadEntries.push({
          purchase_order_item_id: item.id,
          quantity_received: entry.quantity_received,
          expiration_date: entry.expiration_date || undefined,
        });
      }
    }

    setValidationError(null);
    await onConfirm({ entries: payloadEntries });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="登记入库并完成收货" centered size="xl">
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} c="blue">
          每条采购明细可拆分为多条入库记录，并分别设置有效期。
        </Alert>

        {validationError ? (
          <Alert icon={<IconAlertCircle size={16} />} c="red">
            {validationError}
          </Alert>
        ) : null}

        {items.length === 0 ? (
          <Text c="dimmed">该采购订单没有可收货的明细。</Text>
        ) : (
          items.map((item) => {
            const itemEntries = entriesByItem[item.id] || [];
            const totalReceived = itemEntries.reduce((sum, entry) => sum + entry.quantity_received, 0);

            return (
              <Paper key={item.id} withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{getProductLabel(item)}</Text>
                      <Text size="sm" c="dimmed">
                        需求数量： {formatNumber(item.quantity, 4)} ， {formatNumber(item.unit_cost, 2)} 单位成本
                      </Text>
                    </div>
                    <Text size="sm" c={Math.abs(totalReceived - Number(item.quantity)) > 0.0001 ? 'red' : 'green'}>
                      计划入库： {formatNumber(totalReceived, 4)}
                    </Text>
                  </Group>

                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>数量</Table.Th>
                        <Table.Th>有效期截止日期</Table.Th>
                        <Table.Th>预览</Table.Th>
                        <Table.Th style={{ width: 60 }}>操作</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {itemEntries.map((entry) => (
                        <Table.Tr key={entry.id}>
                          <Table.Td style={{ minWidth: 180 }}>
                            <NumberInput
                              value={entry.quantity_received}
                              onChange={(value) =>
                                handleEntryChange(item.id, entry.id, 'quantity_received', value || 0)
                              }
                              min={0}
                              step={1}
                              decimalScale={4}
                              disabled={isLoading}
                            />
                          </Table.Td>
                          <Table.Td style={{ minWidth: 220 }}>
                            <DateInput
                              placeholder="请选择有效期截止日期（选填）"
                              value={entry.expiration_date ? new Date(entry.expiration_date) : null}
                              onChange={(date) =>
                                handleEntryChange(
                                  item.id,
                                  entry.id,
                                  'expiration_date',
                                  date ? date.toISOString().split('T')[0] : ''
                                )
                              }
                              disabled={isLoading}
                              clearable
                            />
                          </Table.Td>
                          <Table.Td>
                            {entry.expiration_date ? formatDate(entry.expiration_date) : '未设置有效期'}
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => handleRemoveEntry(item.id, entry.id)}
                              disabled={isLoading || itemEntries.length === 1}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      本次收货数量： {formatDate(new Date().toISOString())}
                    </Text>
                    <Button
                      leftSection={<IconPlus size={16} />}
                      variant="default"
                      onClick={() => handleAddEntry(item.id)}
                      disabled={isLoading}
                    >
                      添加入库记录
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            );
          })
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            订单收货
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
