import React from "react";
import { Alert, Button, Group, Paper, Stack } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { ProductFormFields, type ProductFormValues } from "./ProductFormFields";
import { ProductPriceSection } from "./ProductPriceSection";

interface ProductFormProps {
  form: UseFormReturnType<ProductFormValues>;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  form,
  errorMessage,
  isSubmitting = false,
  submitLabel,
  cancelLabel = "取消",
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
          <ProductFormFields form={form} disabled={isSubmitting} />
          <ProductPriceSection form={form} disabled={isSubmitting} />

          <Group justify="flex-end" pt="xl">
            <Button type="button" variant="light" onClick={onCancel}>
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
