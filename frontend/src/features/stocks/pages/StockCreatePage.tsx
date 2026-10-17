import React from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { useCreateStockEntry } from '@features/stocks/stocks.hooks';
import { useProducts } from '@/features/products/products.hooks';
import { getErrorMessage } from '@shared/utils/errors';
import { StockForm, type StockFormValues } from '../components/form/StockForm';

const StockCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateStockEntry();
  const productsQuery = useProducts();
  const products = productsQuery.data?.results || [];

  const form = useForm<StockFormValues>({
    initialValues: {
      product: '',
      quantity_received: 0,
      source_type: 'manual',
      received_at: new Date().toISOString().split('T')[0],
      expiration_date: '',
    },
    validate: {
      product: (value: string) =>
        value.length === 0 ? '请选择商品' : null,
      quantity_received: (value: number) =>
        value <= 0 ? '数量必须大于 0' : null,
      received_at: (value: string) =>
        value.length === 0 ? '请选择入库日期' : null,
    },
  });

  const handleSubmit = async (values: StockFormValues) => {
    try {
      await createMutation.mutateAsync({
        product: parseInt(values.product, 10),
        quantity_received: values.quantity_received,
        source_type: 'manual',
        received_at: values.received_at,
        expiration_date: values.expiration_date || undefined,
      });
      navigate(ROUTES.stocks);
    } catch (error) {
      console.error(error);
    }
  };

  const errorMessage = createMutation.error ? getErrorMessage(createMutation.error) : null;
  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.name} (${p.sku})`,
  }));

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>新增入库记录</h1>

        <StockForm
          form={form}
          errorMessage={errorMessage}
          isSubmitting={createMutation.isPending}
          submitLabel="创建入库记录"
          cancelLabel="取消"
          productOptions={productOptions}
          isLoadingProducts={productsQuery.isLoading}
          showSourceType={false}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.stocks)}
        />
      </Stack>
    </Container>
  );
};

export default StockCreatePage;
