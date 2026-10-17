import React from 'react';
import { Stack, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';

interface PurchaseOrderFormData {
  order_number: string;
  supplier_name: string;
  ordered_at: string;
}

interface PurchaseOrderFormProps {
  formData: PurchaseOrderFormData;
  onChange: (field: keyof PurchaseOrderFormData, value: string) => void;
  isLoading?: boolean;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  formData,
  onChange,
  isLoading = false,
}) => {
  return (
    <Stack gap="md">
      <TextInput
        label="订单编号"
        placeholder="例如：PO-2024-001"
        value={formData.order_number}
        onChange={(e) => onChange('order_number', e.currentTarget.value)}
        disabled={isLoading}
        required
      />
      <TextInput
        label="供应商名称"
        placeholder="请输入供应商名称"
        value={formData.supplier_name}
        onChange={(e) => onChange('supplier_name', e.currentTarget.value)}
        disabled={isLoading}
        required
      />
      <DateInput
        label="订单日期"
        placeholder="请选择订单日期"
        value={formData.ordered_at ? new Date(formData.ordered_at) : null}
        onChange={(date) => onChange('ordered_at', date ? date.toISOString().split('T')[0] : '')}
        disabled={isLoading}
        required
      />
    </Stack>
  );
};
