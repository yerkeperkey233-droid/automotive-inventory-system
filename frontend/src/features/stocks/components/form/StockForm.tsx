import React from 'react';
import { Alert, Button, Group, Paper, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { UseFormReturnType } from '@mantine/form';
import { StockFormFields, type StockFormValues } from './StockFormFields';

export type { StockFormValues };

interface StockFormProps {
  form: UseFormReturnType<StockFormValues>;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  productOptions: Array<{ value: string; label: string }>;
  isLoadingProducts?: boolean;
  showSourceType?: boolean;
  disableSourceType?: boolean;
  onSubmit: (values: StockFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export const StockForm: React.FC<StockFormProps> = ({
  form,
  errorMessage,
  isSubmitting = false,
  submitLabel,
  cancelLabel = '取消',
  productOptions,
  isLoadingProducts = false,
  showSourceType = true,
  disableSourceType = false,
  onSubmit,
  onCancel,
}) => {
  return (
    <Paper p="lg" radius="md" withBorder>
      {errorMessage ? (
        <Alert icon={<IconAlertCircle size={16} />} c="red" mb="lg">
          {errorMessage}
        </Alert>
      ) : null}

      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <StockFormFields
            form={form}
            productOptions={productOptions}
            isLoadingProducts={isLoadingProducts}
            disabled={isSubmitting}
            showSourceType={showSourceType}
            disableSourceType={disableSourceType}
          />

          <Group justify="flex-end" pt="xl">
            <Button variant="light" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};
