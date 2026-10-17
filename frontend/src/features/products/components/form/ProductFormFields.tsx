import React from 'react';
import { Select, Textarea, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { PRODUCT_UNITS } from '../../product.constants';
import type { ProductUnit } from '../../product.types';

export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  base_unit: ProductUnit;
  amount: number;
}

interface ProductFormFieldsProps {
  form: UseFormReturnType<ProductFormValues>;
  disabled?: boolean;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  form,
  disabled = false,
}) => {
  return (
    <>
      <TextInput
        label="商品编码"
        placeholder="PROD-001"
        {...form.getInputProps('sku')}
        disabled={disabled}
      />

      <TextInput
        label="商品名称"
        placeholder="请输入商品名称"
        {...form.getInputProps('name')}
        disabled={disabled}
      />

      <Textarea
        label="描述"
        placeholder="请输入商品描述"
        minRows={3}
        {...form.getInputProps('description')}
        disabled={disabled}
      />

      <Select
        label="计量单位"
        placeholder="请选择单位"
        data={PRODUCT_UNITS}
        {...form.getInputProps('base_unit')}
        disabled={disabled}
      />
    </>
  );
};
