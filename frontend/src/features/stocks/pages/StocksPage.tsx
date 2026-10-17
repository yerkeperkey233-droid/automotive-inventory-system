import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { useProducts } from '@/features/products/products.hooks';
import type { Product } from '@/features/products/product.types';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { ListPageLayout } from '@components/ui/ListPageLayout';
import { StockToolbar } from '../components/list/StockToolbar';
import { StockFilters } from '../components/list/StockFilters';
import { StockProductsTable } from '../components/list/StockProductsTable';

const StocksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('quantity_desc');

  const query = useProducts({
    search: search || undefined,
  });

  const products = query.data?.results || [];
  const sortedProducts = useMemo(() => {
    const items = products.filter(
      (product: Product) =>
        Number(product.available_quantity) > 0 || product.has_stock_entries
    );

    items.sort((a: Product, b: Product) => {
      switch (ordering) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'quantity_asc':
          return Number(a.available_quantity) - Number(b.available_quantity);
        case 'value_asc':
          return Number(a.total_inventory_value) - Number(b.total_inventory_value);
        case 'value_desc':
          return Number(b.total_inventory_value) - Number(a.total_inventory_value);
        case 'quantity_desc':
        default:
          return Number(b.available_quantity) - Number(a.available_quantity);
      }
    });

    return items;
  }, [ordering, products]);

  if (query.isLoading) {
    return <LoadingState message="正在加载商品库存…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="加载商品库存失败"
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <ListPageLayout
      header={
        <StockToolbar
          stockCount={sortedProducts.length}
          onCreate={() => navigate(ROUTES.stockEntryNew)}
        />
      }
      filters={
        <StockFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={setSearch}
          onSearchClear={() => {
            setSearchInput('');
            setSearch('');
          }}
          ordering={ordering}
          onOrderingChange={setOrdering}
        />
      }
    >
      {sortedProducts.length === 0 && !search ? (
        <EmptyState
          title="暂无库存"
          description="新增入库记录，开始管理库存。"
          actionLabel="新增入库记录"
          onAction={() => navigate(ROUTES.stockEntryNew)}
        />
      ) : sortedProducts.length === 0 ? (
        <EmptyState
          title="没有匹配结果"
          description={`未找到与“${search}”匹配的商品`}
        />
      ) : (
        <StockProductsTable
          products={sortedProducts}
          onRowClick={(product: Product) => navigate(ROUTES.stockDetail(product.id))}
        />
      )}
    </ListPageLayout>
  );
};

export default StocksPage;
