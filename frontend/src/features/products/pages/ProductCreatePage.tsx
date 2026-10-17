import React from 'react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { getErrorMessage } from '@shared/utils/errors';
import { ProductForm } from '../components/form/ProductForm';
import type { ProductFormValues } from '../components/form/ProductFormFields';
import { ProductHeader } from '../components/shared/ProductHeader';
import { useCreateProduct } from '../products.hooks';

const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateProduct();

  const form = useForm<ProductFormValues>({
    initialValues: {
      sku: '',
      name: '',
      description: '',
      base_unit: 'unit',
      amount: 0,
    },
    validate: {
      sku: (value) => (value.length === 0 ? '请输入商品编码' : null),
      name: (value) => (value.length === 0 ? '请输入名称' : null),
      base_unit: (value) => (value ? null : '请选择计量单位'),
      amount: (value) => (value < 0 ? '含量不能为负数' : null),
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      navigate(ROUTES.products);
    } catch (error) {
      console.error(error);
    }
  };

  const errorMessage = createMutation.error
    ? getErrorMessage(createMutation.error)
    : null;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <ProductHeader
          title="创建商品"
          subtitle="新增商品并设置其库存计量单位。"
          actions={
            <Group>
              <Button variant="light" onClick={() => navigate(ROUTES.products)}>
                返回商品列表
              </Button>
            </Group>
          }
        />

        <ProductForm
          form={form}
          errorMessage={errorMessage}
          isSubmitting={createMutation.isPending}
          submitLabel="创建商品"
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.products)}
        />
      </Stack>
    </Container>
  );
};

export default ProductCreatePage;
