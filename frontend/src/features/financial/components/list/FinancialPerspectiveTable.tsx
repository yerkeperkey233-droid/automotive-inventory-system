import React from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import type {
  FinancialPerspective,
  FinancialPerspectiveItem,
  ProductFinancialItem,
  PurchaseItemFinancialItem,
} from '../../financial.types';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from '@shared/utils/formatting';

interface FinancialPerspectiveTableProps {
  perspective: FinancialPerspective;
  items: FinancialPerspectiveItem[];
  selectedIds: number[];
  onToggleItem: (id: number) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
}

const renderMetricCell = (value: number | string | null, type: 'currency' | 'number' | 'percentage') => {
  if (value === null) {
    return '暂无';
  }

  if (type === 'currency') {
    return formatCurrency(value);
  }

  if (type === 'percentage') {
    return formatPercentage(value);
  }

  return formatNumber(value, 4);
};

const toSafeNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const getBalance = (
  revenue: number | string | null | undefined,
  purchaseCost: number | string | null | undefined
): number => {
  return toSafeNumber(revenue) - toSafeNumber(purchaseCost);
};

const getSignedMetricColor = (value: number): string => {
  return value >= 0 ? 'green.7' : 'red.7';
};

const renderPrimaryCell = (perspective: FinancialPerspective, item: FinancialPerspectiveItem) => {
  if (perspective === 'products') {
    const product = item as ProductFinancialItem;
    return (
      <Stack gap={2}>
        <Text fw={600}>{product.name}</Text>
        <Group gap="xs">
          <Badge variant="light">{product.sku}</Badge>
          {/* <Text size="xs" c="dimmed">
            {product.base_unit}
          </Text> */}
        </Group>
      </Stack>
    );
  }

  if (perspective === 'purchase-items') {
    const purchaseItem = item as PurchaseItemFinancialItem;
    return (
      <Stack gap={2}>
        <Text fw={600}>{purchaseItem.order_number}</Text>
        <Group gap="xs">
          <Badge variant="light">{purchaseItem.product_name}</Badge>
          <Text size="xs" c="dimmed">
            {purchaseItem.product_sku}
          </Text>
        </Group>
      </Stack>
    );
  }
};

export const FinancialPerspectiveTable: React.FC<FinancialPerspectiveTableProps> = ({
  perspective,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  onClearSelection,
}) => {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0;

  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Stack gap={2}>
            <Text fw={700} size="lg">
              明细统计
            </Text>
            {/* <Text size="sm" c="dimmed">
              选择多行后，汇总卡片将显示所选项目的合计数据。
            </Text> */}
          </Stack>

          <Group gap="sm">
            {someSelected ? (
              <Text size="sm" c="dimmed">
                {selectedIds.length} 项已选择
              </Text>
            ) : null}
            <Button variant="light" onClick={onToggleAll}>
              {allSelected ? '取消当前列表选择' : '全选'}
            </Button>
            {someSelected ? (
              <Button variant="subtle" color="gray" onClick={onClearSelection}>
                清空选择
              </Button>
            ) : null}
          </Group>
        </Group>

        <ScrollArea>
          <Table striped highlightOnHover style={{ minWidth: 1180 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 56 }}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={onToggleAll}
                    aria-label="选择全部行"
                  />
                </Table.Th>
                <Table.Th>明细</Table.Th>
                {perspective === 'purchase-items' ? <Table.Th>单位成本</Table.Th> : null}
                {perspective === 'purchase-items' ? <Table.Th>剩余库存金额</Table.Th> : null}
                <Table.Th>采购数量</Table.Th>
                <Table.Th>销售数量</Table.Th>
                <Table.Th>余额</Table.Th>
                <Table.Th>采购成本</Table.Th>
                <Table.Th>收入</Table.Th>
                <Table.Th>销售成本</Table.Th>
                <Table.Th>利润</Table.Th>
                <Table.Th>利润率</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const balance = getBalance(item.total_revenue, item.total_purchase_cost);

                return (
                  <Table.Tr
                    key={item.id}
                    style={isSelected ? { backgroundColor: 'var(--mantine-color-blue-0)' } : undefined}
                  >
                    <Table.Td>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleItem(item.id)}
                        aria-label={`选择 ${item.name}`}
                      />
                    </Table.Td>
                    <Table.Td>{renderPrimaryCell(perspective, item)}</Table.Td>
                    {perspective === 'purchase-items' ? (
                      <Table.Td>
                        {formatCurrency((item as PurchaseItemFinancialItem).unit_cost)}
                      </Table.Td>
                    ) : null}
                    {perspective === 'purchase-items' ? (
                      <Table.Td>
                        {formatCurrency((item as PurchaseItemFinancialItem).remaining_value)}
                      </Table.Td>
                    ) : null}
                    <Table.Td>{renderMetricCell(item.quantity_purchased, 'number')}</Table.Td>
                    <Table.Td>{renderMetricCell(item.quantity_sold, 'number')}</Table.Td>
                    <Table.Td>
                      <Text fw={600} c={getSignedMetricColor(balance)}>
                        {formatCurrency(balance)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{renderMetricCell(item.total_purchase_cost, 'currency')}</Table.Td>
                    <Table.Td>{renderMetricCell(item.total_revenue, 'currency')}</Table.Td>
                    <Table.Td>{renderMetricCell(item.total_cogs, 'currency')}</Table.Td>
                    <Table.Td>{renderMetricCell(item.profit, 'currency')}</Table.Td>
                    <Table.Td>{renderMetricCell(item.profit_margin, 'percentage')}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
};
