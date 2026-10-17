import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Group, Paper, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { useProducts } from '@/features/products/products.hooks';
import { getErrorMessage } from '@shared/utils/errors';
import {
  useSalesOrder,
  useUpdateSalesOrder,
} from '@features/sales-orders/salesOrders.hooks';
import { ActionErrorAlert } from '../components/list/ActionErrorAlert';
import { SalesOrderForm, type SalesOrderFormData } from '../components/form/SalesOrderForm';
import {
  SalesOrderItemsTable,
  type SalesOrderFormItem,
} from '../components/form/SalesOrderItemsTable';

const SalesOrderEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id ? parseInt(id, 10) : null;

  const orderQuery = useSalesOrder(orderId);
  const updateMutation = useUpdateSalesOrder();
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

  const [errorAlert, setErrorAlert] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  useEffect(() => {
    if (orderQuery.data) {
      const order = orderQuery.data;
      setFormData({
        order_number: order.order_number || '',
        customer_name: order.customer_name || '',
        sold_at: order.sold_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      });

      if (order.items && order.items.length > 0) {
        setItems(
          order.items.map((item) => ({
            product: products.find((product) => product.id === item.product) || null,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          }))
        );
      } else {
        setItems([{ product: null, quantity: 0, unit_price: 0 }]);
      }
    }
  }, [orderQuery.data, products]);

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
    if (!orderId) return;
    const isItemsLocked = orderQuery.data?.status === 'confirmed';

    if (!formData.order_number.trim()) {
      alert('请输入订单编号');
      return;
    }

    const validItems = items.filter((item) => item.product && item.quantity > 0);
    if (!isItemsLocked && validItems.length === 0) {
      alert('请至少添加一条明细');
      return;
    }

    try {
      const payload: {
        order_number: string;
        customer_name?: string;
        sold_at: string;
        items?: Array<{ product: number; quantity: number; unit_price: number }>;
      } = {
        order_number: formData.order_number,
        customer_name: formData.customer_name || undefined,
        sold_at: new Date(formData.sold_at).toISOString(),
      };

      if (!isItemsLocked) {
        payload.items = validItems.map((item) => ({
          product: item.product!.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));
      }

      await updateMutation.mutateAsync({
        id: orderId,
        payload,
      });
      navigate(`/sales-orders/${orderId}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (orderQuery.isLoading) {
    return <LoadingState message="正在加载销售订单…" />;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <ErrorState message="加载销售订单失败" onRetry={() => orderQuery.refetch()} />;
  }

  const errorMessage = updateMutation.error ? getErrorMessage(updateMutation.error) : null;
  const isItemsLocked = orderQuery.data.status === 'confirmed';

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>编辑销售订单</h1>

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
              isLoading={updateMutation.isPending}
            />

            <SalesOrderItemsTable
              items={items}
              products={products}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              isLoading={updateMutation.isPending}
              isLocked={isItemsLocked}
            />

            {isItemsLocked ? (
              <Text size="sm" c="dimmed">
                该销售订单已确认，明细不可修改。
              </Text>
            ) : null}

            <Group justify="flex-end" pt="xl">
              <Button
                variant="light"
                onClick={() => navigate(`/sales-orders/${orderId}`)}
                disabled={updateMutation.isPending}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} loading={updateMutation.isPending}>
                保存修改
              </Button>
            </Group>
          </Stack>
        </Paper>

        <ActionErrorAlert
          opened={errorAlert.isOpen}
          message={errorAlert.message}
          onClose={() => setErrorAlert({ isOpen: false, message: '' })}
        />
      </Stack>
    </Container>
  );
};

export default SalesOrderEditPage;
