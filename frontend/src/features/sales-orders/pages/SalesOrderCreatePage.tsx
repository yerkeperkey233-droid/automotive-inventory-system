import React, { useState } from 'react';
import { Alert, Button, Container, Group, Paper, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/features/products/products.hooks';
import { getErrorMessage } from '@shared/utils/errors';
import { useCreateSalesOrder } from '@features/sales-orders/salesOrders.hooks';
import { SalesOrderForm, type SalesOrderFormData } from '../components/form/SalesOrderForm';
import {
  SalesOrderItemsTable,
  type SalesOrderFormItem,
} from '../components/form/SalesOrderItemsTable';

const SalesOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateSalesOrder();
  const productsQuery = useProducts();
  const products = productsQuery.data?.results || [];

  const [formData, setFormData] = useState<SalesOrderFormData>({
    order_number: '',
    customer_name: '',
    sold_at: new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<SalesOrderFormItem[]>([
    { product: null, quantity: 0, unit_price: 0 },
  ]);

  const handleFormChange = (field: keyof SalesOrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof SalesOrderFormItem,
    value: SalesOrderFormItem[keyof SalesOrderFormItem]
  ) => {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], [field]: value };
    setItems(nextItems);
  };

  const handleAddItem = () => {
    setItems([...items, { product: null, quantity: 0, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    if (!formData.order_number.trim()) {
      alert('请输入订单编号');
      return;
    }

    const validItems = items.filter((item) => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      alert('请至少添加一条明细');
      return;
    }

    try {
      await createMutation.mutateAsync({
        order_number: formData.order_number,
        customer_name: formData.customer_name || undefined,
        sold_at: new Date(formData.sold_at).toISOString(),
        items: validItems.map((item) => ({
          product: item.product!.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      navigate('/sales-orders');
    } catch (error) {
      console.error(error);
    }
  };

  const errorMessage = createMutation.error ? getErrorMessage(createMutation.error) : null;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>创建销售订单</h1>

        <Paper p="lg" radius="md" withBorder>
          {errorMessage && (
            <Alert icon={<IconAlertCircle size={16} />} c="red" mb="lg">
              {errorMessage}
            </Alert>
          )}

          <Stack gap="md">
            <SalesOrderForm
              formData={formData}
              onChange={handleFormChange}
              isLoading={createMutation.isPending}
            />

            <SalesOrderItemsTable
              items={items}
              products={products}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              isLoading={createMutation.isPending}
            />

            <Group justify="flex-end" pt="xl">
              <Button
                variant="light"
                onClick={() => navigate('/sales-orders')}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} loading={createMutation.isPending}>
                创建订单
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default SalesOrderCreatePage;
