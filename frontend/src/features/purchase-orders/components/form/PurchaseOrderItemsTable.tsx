import React from 'react';
import { Table, Select, NumberInput, ActionIcon, Button, Paper, Stack, Text } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { formatCurrency } from '@shared/utils/formatting';
import type { Product } from '@features/products/product.types';

export interface OrderItem {
  id?: string;
  product: Product | null;
  quantity: number;
  unit_cost: number;
}

interface PurchaseOrderItemsTableProps {
  items: OrderItem[];
  products: Product[];
  onItemChange: (index: number, field: keyof OrderItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  isLoading?: boolean;
  isLocked?: boolean;
}

export const PurchaseOrderItemsTable: React.FC<PurchaseOrderItemsTableProps> = ({
  items,
  products,
  onItemChange,
  onAddItem,
  onRemoveItem,
  isLoading = false,
  isLocked = false,
}) => {
  const productOptions = products
    .filter((product) => product?.id !== undefined && product?.id !== null)
    .map((product) => ({
      value: product.id.toString(),
      label: product.name,
    }));

  const totalCost = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_cost;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);

  return (
    <Stack gap="md">
      <Text fw={600} size="lg">
        订单明细
      </Text>
      <Paper p="lg" radius="md" withBorder style={{ width: '100%', overflowX: 'auto' }}>
        <Table striped style={{ width: '100%', minWidth: 700 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '35%' }}>商品</Table.Th>
              <Table.Th style={{ width: '20%', textAlign: 'center' }}>数量</Table.Th>
              <Table.Th style={{ width: '20%', textAlign: 'center' }}>单位成本</Table.Th>
              <Table.Th style={{ width: '20%', textAlign: 'right' }}>小计</Table.Th>
              <Table.Th style={{ width: '5%', textAlign: 'center' }}>操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  <Text c="dimmed" size="sm">
                    No items added yet. Click "添加明细" to add products.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item, index) => {
                const subtotal = item.quantity * item.unit_cost;
                return (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Select
                        placeholder="请选择商品"
                        data={productOptions}
                        value={item.product?.id?.toString() ?? null}
                        onChange={(value) => {
                          const product = products.find((p) => p.id.toString() === value);
                          onItemChange(index, 'product', product || null);
                        }}
                        disabled={isLoading || isLocked}
                        searchable
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) =>
                          onItemChange(index, 'quantity', typeof value === 'number' ? value : Number(value) || 0)
                        }
                        disabled={isLoading || isLocked}
                        min={0}
                        step={1}
                        style={{ textAlign: 'center' }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.unit_cost}
                        onChange={(value) =>
                          onItemChange(index, 'unit_cost', typeof value === 'number' ? value : Number(value) || 0)
                        }
                        disabled={isLoading || isLocked}
                        min={0}
                        step={0.01}
                        style={{ textAlign: 'center' }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(isNaN(subtotal) ? 0 : subtotal)}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => onRemoveItem(index)}
                        disabled={isLoading || isLocked}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr>
              <Table.Td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>
                合计：
              </Table.Td>
              <Table.Td style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
                {formatCurrency(totalCost)}
              </Table.Td>
              <Table.Td></Table.Td>
            </Table.Tr>
          </Table.Tfoot>
        </Table>
      </Paper>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={onAddItem}
        disabled={isLoading || isLocked}
        variant="default"
      >
        添加明细
      </Button>
    </Stack>
  );
};
