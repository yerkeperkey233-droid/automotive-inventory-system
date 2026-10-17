import React from 'react';
import { Badge } from '@mantine/core';

interface ProductStatusBadgeProps {
  quantityInStock: number;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  quantityInStock,
}) => {
  if (quantityInStock <= 0) {
    return <Badge color="red">无库存</Badge>;
  }

  if (quantityInStock < 10) {
    return <Badge color="yellow">库存不足</Badge>;
  }

  return <Badge color="green">有库存</Badge>;
};
