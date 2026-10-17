import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
} from '../purchaseOrders.hooks';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { EmptyState } from '@components/ui/EmptyState';
import { ListPageHeader } from '@components/ui/ListPageHeader';
import { ListPageLayout } from '@components/ui/ListPageLayout';
import { ListTableCard } from '@components/ui/ListTableCard';
import { PurchaseOrdersTable } from '../components/list/PurchaseOrdersTable';
import { PurchaseOrdersFilters } from '../components/list/PurchaseOrdersFilters';
import { DeleteConfirmationModal } from '../components/list/DeleteConfirmationModal';
import { ActionErrorAlert } from '../components/list/ActionErrorAlert';

const PurchaseOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-ordered_at');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; orderId: number | null }>({
    isOpen: false,
    orderId: null,
  });
  const [errorAlert, setErrorAlert] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const query = usePurchaseOrders({
    search: search || undefined,
    ordering: ordering,
  });

  const deleteMutation = useDeletePurchaseOrder();

  const handleDeleteConfirm = async () => {
    if (deleteModal.orderId) {
      try {
        await deleteMutation.mutateAsync(deleteModal.orderId);
        setDeleteModal({ isOpen: false, orderId: null });
      } catch (error) {
        console.error('删除失败：', error);
      }
    }
  };

  if (query.isLoading) {
    return <LoadingState message="正在加载采购订单列表…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message="加载采购订单列表失败"
        onRetry={() => query.refetch()}
      />
    );
  }

  const orders = query.data?.results || [];

  return (
    <ListPageLayout
      contentWidth="92%"
      header={
        <ListPageHeader
          title="采购订单"
          itemCount={orders.length}
          itemLabel="order"
          actionLabel="新增订单"
          onAction={() => navigate('/purchase-orders/new')}
        />
      }
      filters={
        <PurchaseOrdersFilters
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
      {orders.length === 0 && !search ? (
        <EmptyState
          title="暂无采购订单"
          description="请先创建采购订单"
          actionLabel="创建订单"
          onAction={() => navigate('/purchase-orders/new')}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="没有匹配结果"
          description={`未找到与“${search}”匹配的采购订单`}
        />
      ) : (
        <ListTableCard>
          <PurchaseOrdersTable
            orders={orders}
            onEdit={(id) => navigate(`/purchase-orders/${id}/edit`)}
            onDelete={(id) => setDeleteModal({ isOpen: true, orderId: id })}
            onRowClick={(order) => navigate(`/purchase-orders/${order.id}`)}
          />
        </ListTableCard>
      )}

      <DeleteConfirmationModal
        opened={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, orderId: null })}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      <ActionErrorAlert
        opened={errorAlert.isOpen}
        message={errorAlert.message}
        onClose={() => setErrorAlert({ isOpen: false, message: '' })}
      />
    </ListPageLayout>
  );
};

export default PurchaseOrdersPage;
