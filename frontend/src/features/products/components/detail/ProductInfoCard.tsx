import React from 'react';
import { Grid, Group, Paper, Stack, Text } from '@mantine/core';
import { formatDate, formatUnit } from '@shared/utils/formatting';
import type { Product } from '../../product.types';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductImage } from '../shared/ProductImage';

interface ProductInfoCardProps {
  product: Product;
}

const InfoItem: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <Text size="sm" c="dimmed" fw={500} mb={4}>
      {label}
    </Text>
    {children}
  </div>
);

export const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  product,
}) => {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group>
          <ProductImage name={product.name} size={72} radius="xl" />
          <Stack gap={2}>
            <Text fw={700} size="lg">
              {product.name}
            </Text>
            <ProductStatusBadge quantityInStock={product.available_quantity} />
          </Stack>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label="商品编码">
              <Text fw={600}>{product.sku}</Text>
            </InfoItem>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}></Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label="计量单位">
              <Text fw={600}>{formatUnit(product.base_unit)}</Text>
            </InfoItem>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label="单件含量">
              <Text fw={600}>
                {product.amount} {formatUnit(product.base_unit)}
              </Text>
            </InfoItem>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label="创建时间">
              <Text>{formatDate(product.created_at)}</Text>
            </InfoItem>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6 }}>
            <InfoItem label="更新时间">
              <Text>{formatDate(product.updated_at)}</Text>
            </InfoItem>
          </Grid.Col>

          <Grid.Col span={12}>
            <InfoItem label="描述">
              <Text>{product.description || '暂无描述'}</Text>
            </InfoItem>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
};
