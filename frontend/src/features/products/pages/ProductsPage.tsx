import React, { useState } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { ListPageLayout } from '@components/ui/ListPageLayout';
import { LoadingState } from '@components/ui/LoadingState';
import { useDeleteProduct, useProducts } from '../products.hooks';
import type { Product } from '../product.types';
import { ProductFilters } from '../components/list/ProductFilters';
import { ProductTable } from '../components/list/ProductTable';
import { ProductToolbar } from '../components/list/ProductToolbar';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: number | null;
  }>({
    isOpen: false,
    productId: null,
  });
  const query = useProducts({ search: search || undefined });
  const deleteMutation = useDeleteProduct();

  const handleDeleteConfirm = async () => {
    if (deleteModal.productId) {
      try {
        await deleteMutation.mutateAsync(deleteModal.productId);
        setDeleteModal({ isOpen: false, productId: null });
      } catch (error) {
        console.error('删除失败：', error);
      }
    }
  };

  if (query.isLoading) {
    return <LoadingState message="正在加载商品列表…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="加载商品列表失败"
        onRetry={() => query.refetch()}
      />
    );
  }

  const products = query.data?.results || [];

  return (
    <ListPageLayout
      header={
        <ProductToolbar
          productCount={products.length}
          onCreate={() => navigate(ROUTES.productNew)}
        />
      }
      filters={
        <ProductFilters
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={() => setSearch(searchInput)}
          onClear={() => {
            setSearchInput('');
            setSearch('');
          }}
        />
      }
    >
      {products.length === 0 && !search ? (
        <EmptyState
          title="暂无商品"
          description="请先创建商品"
          actionLabel="创建商品"
          onAction={() => navigate(ROUTES.productNew)}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="没有匹配结果"
          description={`未找到与“${search}”匹配的商品`}
        />
      ) : (
        <ProductTable
          products={products}
          onRowClick={(product: Product) => navigate(ROUTES.productDetail(product.id))}
          onEdit={(product: Product) => navigate(ROUTES.productEdit(product.id))}
          onDelete={(product: Product) =>
            setDeleteModal({ isOpen: true, productId: product.id })
          }
        />
      )}

      <Modal
        opened={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        title="删除商品"
        centered
      >
        <Stack>
          <Text>
            确定删除该商品吗？此操作无法撤销。
          </Text>
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setDeleteModal({ isOpen: false, productId: null })}
            >
              取消
            </Button>
            <Button
              color="red"
              loading={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </ListPageLayout>
  );
};

export default ProductsPage;
