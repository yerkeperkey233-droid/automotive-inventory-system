import React from 'react';
import { ListPageHeader } from '@components/ui/ListPageHeader';

interface ProductToolbarProps {
  productCount: number;
  onCreate: () => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  productCount,
  onCreate,
}) => {
  return (
    <ListPageHeader
      title="商品管理"
      itemCount={productCount}
      itemLabel="product"
      actionLabel="新增商品"
      onAction={onCreate}
    />
  );
};
