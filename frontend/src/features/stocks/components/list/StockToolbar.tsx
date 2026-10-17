import React from 'react';
import { ListPageHeader } from '@components/ui/ListPageHeader';

interface StockToolbarProps {
  stockCount: number;
  onCreate: () => void;
}

export const StockToolbar: React.FC<StockToolbarProps> = ({
  stockCount,
  onCreate,
}) => {
  return (
    <ListPageHeader
      title="库存管理"
      itemCount={stockCount}
      itemLabel="product"
      actionLabel="新增入库记录"
      onAction={onCreate}
    />
  );
};
