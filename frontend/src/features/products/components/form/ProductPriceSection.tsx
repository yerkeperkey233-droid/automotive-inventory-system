import React from 'react';
import { NumberInput, Stack, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import type { ProductFormValues } from './ProductFormFields';

interface ProductPriceSectionProps {
  form: UseFormReturnType<ProductFormValues>;
  disabled?: boolean;
}

export const ProductPriceSection: React.FC<ProductPriceSectionProps> = ({
  form,
  disabled = false,
}) => {
  return (
    <Stack gap="xs">
      <Text fw={600}>单件含量</Text>
      <NumberInput
        label="单件含量"
        placeholder="请输入单件商品的含量"
        min={0}
        step={0.01}
        description="单件商品的含量，单位可选千克、克、升、毫升或件。"
        {...form.getInputProps('amount')}
        disabled={disabled}
      />
    </Stack>
  );
};
