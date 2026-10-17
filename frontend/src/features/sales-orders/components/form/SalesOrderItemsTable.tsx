import React from 'react';
import { ActionIcon, Button, NumberInput, Paper, Select, Stack, Table, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type { Product } from '@features/products/product.types';
import { formatCurrency } from '@shared/utils/formatting';

export interface SalesOrderFormItem {
  product: Product | null;
  quantity: number;
  unit_price: number;
}

interface SalesOrderItemsTableProps {
  items: SalesOrderFormItem[];
  products: Product[];
  onItemChange: (index: number, field: keyof SalesOrderFormItem, value: Product | null | number) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  isLoading?: boolean;
  isLocked?: boolean;
}

export const SalesOrderItemsTable: React.FC<SalesOrderItemsTableProps> = ({
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
      label: `${product.name} (${product.sku})`,
    }));

  const totalRevenue = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price;
    return sum + (Number.isNaN(itemTotal) ? 0 : itemTotal);
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
              <Table.Th style={{ width: '20%', textAlign: 'center' }}>销售单价</Table.Th>
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
                const subtotal = item.quantity * item.unit_price;

                return (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Select
                        placeholder="请选择商品"
                        data={productOptions}
                        value={item.product?.id?.toString() ?? null}
                        onChange={(value) => {
                          const product = products.find((productOption) => productOption.id.toString() === value);
                          onItemChange(index, 'product', product || null);
                        }}
                        disabled={isLoading || isLocked}
                        searchable
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => onItemChange(index, 'quantity', typeof value === 'number' ? value : 0)}
                        disabled={isLoading || isLocked}
                        min={0}
                        step={1}
                        style={{ textAlign: 'center' }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.unit_price}
                        onChange={(value) =>
                          onItemChange(index, 'unit_price', typeof value === 'number' ? value : 0)
                        }
                        disabled={isLoading || isLocked}
                        min={0}
                        step={0.01}
                        style={{ textAlign: 'center' }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {formatCurrency(Number.isNaN(subtotal) ? 0 : subtotal)}
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
                {formatCurrency(totalRevenue)}
              </Table.Td>
              <Table.Td />
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
