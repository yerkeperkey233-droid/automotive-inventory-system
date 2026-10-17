import React from 'react';
import { Paper, Stack, Text } from '@mantine/core';
import { formatNumber } from '@shared/utils/formatting';
import type { Product } from '../../product.types';

interface ProductInventoryCardProps {
  product: Product;
}

const Metric: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <Stack gap={4}>
    <Text size="sm" c="dimmed" fw={500}>
      {label}
    </Text>
    <Text fw={700} size="lg">
      {value}
    </Text>
  </Stack>
);

export const ProductInventoryCard: React.FC<ProductInventoryCardProps> = ({
  product,
}) => {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Text fw={700} size="lg">
          库存
        </Text>

        <Metric
          label="库存数量"
          value={formatNumber(product.available_quantity, 0)}
        />
      </Stack>
    </Paper>
  );
};
