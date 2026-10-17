import React, { useState } from 'react';
import {
  Container,
  Paper,
  Stack,
  Button,
  Group,
  Alert,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useCreatePurchaseOrder } from '../purchaseOrders.hooks';
import { useProducts } from '@/features/products/products.hooks';
import { getErrorMessage } from '@shared/utils/errors';
import { PurchaseOrderForm } from '../components/form/PurchaseOrderForm';
import { PurchaseOrderItemsTable, type OrderItem } from '../components/form/PurchaseOrderItemsTable';

const PurchaseOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseOrder();
  const productsQuery = useProducts();
  const products = productsQuery.data?.results || [];

  const [formData, setFormData] = useState({
    order_number: '',
    supplier_name: '',
    ordered_at: new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<OrderItem[]>([
    { product: null, quantity: 0, unit_cost: 0 },
  ]);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { product: null, quantity: 0, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
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
        supplier_name: formData.supplier_name || undefined,
        ordered_at: new Date(formData.ordered_at).toISOString(),
        items: validItems.map((item) => ({
          product: item.product!.id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      });
      navigate('/purchase-orders');
    } catch (error) {
      console.error(error);
    }
  };

  const errorMessage = createMutation.error
    ? getErrorMessage(createMutation.error)
    : null;

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>创建采购订单</h1>

        <Paper p="lg" radius="md" withBorder>
          {errorMessage && (
            <Alert icon={<IconAlertCircle size={16} />} c="red" mb="lg">
              {errorMessage}
            </Alert>
          )}

          <Stack gap="md">
            <PurchaseOrderForm
              formData={formData}
              onChange={handleFormChange}
              isLoading={createMutation.isPending}
            />

            <PurchaseOrderItemsTable
              items={items}
              products={products}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              isLoading={createMutation.isPending}
            />

            {/* Actions */}
            <Group justify="flex-end" pt="xl">
              <Button
                variant="light"
                onClick={() => navigate('/purchase-orders')}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createMutation.isPending}
              >
                创建订单
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default PurchaseOrderCreatePage;
