import React from 'react';
import { NumberInput, Select, Stack, TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

export interface StockFormValues {
  product: string;
  quantity_received: number;
  source_type: string;
  received_at: string;
  expiration_date: string;
}

interface StockFormFieldsProps {
  form: UseFormReturnType<StockFormValues>;
  productOptions: Array<{ value: string; label: string }>;
  isLoadingProducts?: boolean;
  disabled?: boolean;
  showSourceType?: boolean;
  disableSourceType?: boolean;
}

export const StockFormFields: React.FC<StockFormFieldsProps> = ({
  form,
  productOptions,
  isLoadingProducts = false,
  disabled = false,
  showSourceType = true,
  disableSourceType = false,
}) => {
  return (
    <Stack gap="md">
      <Select
        label="商品"
        placeholder="请选择商品"
        data={productOptions}
        {...form.getInputProps('product')}
        disabled={disabled || isLoadingProducts}
        searchable
        required
      />

      {showSourceType ? (
        <Select
          label="来源类型"
          placeholder="请选择来源类型"
          data={[
            { value: 'manual', label: '手工入库' },
            { value: 'purchase_order', label: '采购订单' },
          ]}
          {...form.getInputProps('source_type')}
          disabled={disabled || disableSourceType}
          required
        />
      ) : null}

      <NumberInput
        label="入库数量"
        placeholder="请输入数量"
        min={1}
        {...form.getInputProps('quantity_received')}
        disabled={disabled}
        required
      />

      <TextInput
        label="入库日期"
        type="date"
        {...form.getInputProps('received_at')}
        disabled={disabled}
        required
      />

      <TextInput
        label="有效期截止日期（选填）"
        type="date"
        {...form.getInputProps('expiration_date')}
        disabled={disabled}
      />
    </Stack>
  );
};
