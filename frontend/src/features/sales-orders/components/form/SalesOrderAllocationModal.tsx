import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { IconAlertCircle } from '@tabler/icons-react';
import { useStocks } from '@features/stocks/stocks.hooks';
import type { StockEntry } from '@features/stocks/stock.types';
import { formatDate, formatNumber } from '@shared/utils/formatting';
import type { ConfirmSalesOrderAllocationPayload, SalesOrder } from '../../salesOrder.types';

interface SalesOrderAllocationModalProps {
  opened: boolean;
  order: SalesOrder;
  onClose: () => void;
  onConfirm: (payload: ConfirmSalesOrderAllocationPayload) => Promise<void>;
  isLoading?: boolean;
}

const getAllocationKey = (salesOrderItemId: number, stockEntryId: number) =>
  `${salesOrderItemId}:${stockEntryId}`;

const sortStockEntries = (left: StockEntry, right: StockEntry) => {
  const leftExpiration = left.expiration_date ? new Date(left.expiration_date).getTime() : Number.MAX_SAFE_INTEGER;
  const rightExpiration = right.expiration_date ? new Date(right.expiration_date).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftExpiration !== rightExpiration) {
    return leftExpiration - rightExpiration;
  }

  return new Date(left.received_at).getTime() - new Date(right.received_at).getTime();
};

export const SalesOrderAllocationModal: React.FC<SalesOrderAllocationModalProps> = ({
  opened,
  order,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const stocksQuery = useStocks({ ordering: 'expiration_date' });
  const [allocationMap, setAllocationMap] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const stockEntries = useMemo(
    () =>
      (stocksQuery.data?.results || [])
        .filter((entry) => Number(entry.quantity_available) > 0)
        .sort(sortStockEntries),
    [stocksQuery.data]
  );

  useEffect(() => {
    if (!opened || !order.items) {
      return;
    }

    const suggestedAllocations: Record<string, number> = {};

    order.items.forEach((item) => {
      let remainingQuantity = Number(item.quantity);
      const matchingEntries = stockEntries.filter((entry) => entry.product === item.product);

      matchingEntries.forEach((entry) => {
        if (remainingQuantity <= 0) {
          return;
        }

        const suggestedQuantity = Math.min(Number(entry.quantity_available), remainingQuantity);
        if (suggestedQuantity > 0) {
          suggestedAllocations[getAllocationKey(item.id, entry.id)] = suggestedQuantity;
          remainingQuantity -= suggestedQuantity;
        }
      });
    });

    setAllocationMap(suggestedAllocations);
    setValidationError(null);
  }, [opened, order.items, stockEntries]);

  const handleAllocationChange = (salesOrderItemId: number, stockEntryId: number, value: string | number) => {
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    const key = getAllocationKey(salesOrderItemId, stockEntryId);

    setAllocationMap((current) => ({
      ...current,
      [key]: numericValue,
    }));
  };

  const handleSubmit = async () => {
    if (!order.items) {
      return;
    }

    const allocations: ConfirmSalesOrderAllocationPayload['allocations'] = [];

    for (const item of order.items) {
      const matchingEntries = stockEntries.filter((entry) => entry.product === item.product);
      const allocatedTotal = matchingEntries.reduce((sum, entry) => {
        const quantity = allocationMap[getAllocationKey(item.id, entry.id)] || 0;
        return sum + quantity;
      }, 0);

      if (Math.abs(allocatedTotal - Number(item.quantity)) > 0.0001) {
        setValidationError(
          `${item.product_name || `商品 #${item.product}`} 的分配总数量必须为 ${formatNumber(item.quantity, 4)}。`
        );
        return;
      }

      for (const entry of matchingEntries) {
        const quantity = allocationMap[getAllocationKey(item.id, entry.id)] || 0;

        if (quantity < 0 || quantity - Number(entry.quantity_available) > 0.0001) {
          setValidationError(`分配数量超过入库记录 #${entry.id} 的可用库存。`);
          return;
        }

        if (quantity > 0) {
          allocations.push({
            sales_order_item_id: item.id,
            stock_entry_id: entry.id,
            quantity_allocated: quantity,
          });
        }
      }
    }

    setValidationError(null);
    await onConfirm({ allocations });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="分配库存并确认订单"
      centered
      size="xl"
    >
      <Stack gap="md">
        <Alert icon={<IconAlertCircle size={16} />} c="blue">
          确认销售订单前，请检查并调整库存分配。
        </Alert>

        {validationError ? (
          <Alert icon={<IconAlertCircle size={16} />} c="red">
            {validationError}
          </Alert>
        ) : null}

        {stocksQuery.isLoading ? (
          <Text c="dimmed">正在加载入库记录…</Text>
        ) : !order.items?.length ? (
          <Text c="dimmed">该销售订单没有可分配的明细。</Text>
        ) : (
          order.items.map((item) => {
            const matchingEntries = stockEntries.filter((entry) => entry.product === item.product);
            const allocatedTotal = matchingEntries.reduce((sum, entry) => {
              const quantity = allocationMap[getAllocationKey(item.id, entry.id)] || 0;
              return sum + quantity;
            }, 0);

            return (
              <Paper key={item.id} withBorder p="md" radius="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{item.product_name || `商品 #${item.product}`}</Text>
                      <Text size="sm" c="dimmed">
                        需求数量： {formatNumber(item.quantity, 4)}
                      </Text>
                    </div>
                    <Text size="sm" c={Math.abs(allocatedTotal - Number(item.quantity)) > 0.0001 ? 'red' : 'green'}>
                      已分配： {formatNumber(allocatedTotal, 4)}
                    </Text>
                  </Group>

                  {matchingEntries.length === 0 ? (
                    <Alert icon={<IconAlertCircle size={16} />} c="red">
                      该商品暂无可用的入库记录。
                    </Alert>
                  ) : (
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>入库记录</Table.Th>
                          <Table.Th>有效期</Table.Th>
                          <Table.Th>已收货</Table.Th>
                          <Table.Th>可用数量</Table.Th>
                          <Table.Th>分配</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {matchingEntries.map((entry) => (
                          <Table.Tr key={entry.id}>
                            <Table.Td>#{entry.id}</Table.Td>
                            <Table.Td>{entry.expiration_date ? formatDate(entry.expiration_date) : '未设置有效期'}</Table.Td>
                            <Table.Td>{formatDate(entry.received_at)}</Table.Td>
                            <Table.Td>{formatNumber(entry.quantity_available, 4)}</Table.Td>
                            <Table.Td style={{ minWidth: 160 }}>
                              <NumberInput
                                value={allocationMap[getAllocationKey(item.id, entry.id)] || 0}
                                onChange={(value) => handleAllocationChange(item.id, entry.id, value)}
                                min={0}
                                max={Number(entry.quantity_available)}
                                step={1}
                                decimalScale={4}
                                disabled={isLoading}
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            );
          })
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={isLoading || stocksQuery.isLoading}>
            确认订单
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
