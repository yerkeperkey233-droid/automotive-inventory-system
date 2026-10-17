import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Stack, Button, Group, Modal, Text } from '@mantine/core';
import type { AxiosError } from 'axios';
import {
  usePurchaseOrder,
  useDeletePurchaseOrder,
  useConfirmPurchaseOrder,
  useCancelPurchaseOrder,
  useReceivePurchaseOrderWithEntries,
  useReopenPurchaseOrder,
} from '../purchaseOrders.hooks';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { PurchaseOrderDetailHeader } from '../components/detail/PurchaseOrderDetailHeader';
import { PurchaseOrderDetailItems } from '../components/detail/PurchaseOrderDetailItems';
import { DeleteConfirmationModal } from '../components/list/DeleteConfirmationModal';
import { ActionErrorAlert } from '../components/list/ActionErrorAlert';
import { PurchaseOrderReceiveModal } from '../components/form/PurchaseOrderReceiveModal';
import type { ReceivePurchaseOrderEntriesPayload } from '../purchaseOrder.types';

const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id ? parseInt(id, 10) : null;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenMessage, setReopenMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const query = usePurchaseOrder(orderId);
  const deleteMutation = useDeletePurchaseOrder();
  const confirmMutation = useConfirmPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const receiveMutation = useReceivePurchaseOrderWithEntries();
  const reopenMutation = useReopenPurchaseOrder();

  const getErrorDetail = (error: unknown) => {
    const axiosError = error as AxiosError<{
      detail?: string;
      error?: string;
      requires_confirmation?: boolean;
      stock_entry_count?: number;
    }>;
    return axiosError.response?.data;
  };

  const handleDelete = async () => {
    if (orderId) {
      try {
        await deleteMutation.mutateAsync(orderId);
        navigate('/purchase-orders');
      } catch (error) {
        console.error('删除失败：', error);
      }
    }
  };

  const handleConfirmOrder = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await confirmMutation.mutateAsync(orderId!);
      query.refetch();
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || '确认订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  const handleCancelOrder = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await cancelMutation.mutateAsync(orderId!);
      query.refetch();
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || '取消订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  const handleReceiveOrder = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowReceiveModal(true);
  };

  const handleReceiveWithEntries = async (payload: ReceivePurchaseOrderEntriesPayload) => {
    try {
      await receiveMutation.mutateAsync({ id: orderId!, payload });
      setShowReceiveModal(false);
      query.refetch();
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || '订单收货失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  const handleReopenOrder = async (deleteStockEntries = false) => {
    try {
      await reopenMutation.mutateAsync({ id: orderId!, deleteStockEntries });
      setShowReopenModal(false);
      setReopenMessage('');
      await query.refetch();
    } catch (error) {
      const errorData = getErrorDetail(error);
      if (errorData?.requires_confirmation) {
        const count = errorData.stock_entry_count || 0;
        setReopenMessage(
          `该采购订单关联 ${count} 条入库记录，重新打开订单将删除这些记录。确定继续吗？`
        );
        setShowReopenModal(true);
        return;
      }
      const message = errorData?.detail || errorData?.error || '重新打开订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  if (query.isLoading) {
    return <LoadingState message="正在加载采购订单…" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        message="加载采购订单失败"
        onRetry={() => query.refetch()}
      />
    );
  }

  const order = query.data;
  const items = order.items || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <PurchaseOrderDetailHeader
          order={order}
          onEdit={() => navigate(`/purchase-orders/${order.id}/edit`)}
          onDelete={() => setShowDeleteModal(true)}
          onConfirm={handleConfirmOrder}
          onCancel={handleCancelOrder}
          onReceive={handleReceiveOrder}
          onReopen={() => handleReopenOrder(false)}
          confirmLoading={confirmMutation.isPending}
          cancelLoading={cancelMutation.isPending}
          receiveLoading={receiveMutation.isPending}
          reopenLoading={reopenMutation.isPending}
        />

        <PurchaseOrderDetailItems items={items} orderStatus={order.status} />

        <Group justify="flex-end">
          <Button
            variant="light"
            onClick={() => navigate('/purchase-orders')}
          >
            返回
          </Button>
        </Group>

        <DeleteConfirmationModal
          opened={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />

        <ActionErrorAlert
          opened={errorAlert.isOpen}
          message={errorAlert.message}
          onClose={() => setErrorAlert({ isOpen: false, message: '' })}
        />

        <Modal
          opened={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          title="重新打开采购订单"
          centered
        >
          <Stack>
            <Text>{reopenMessage}</Text>
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowReopenModal(false)}>
                取消
              </Button>
              <Button loading={reopenMutation.isPending} color="orange" onClick={() => handleReopenOrder(true)}>
                重新打开并删除入库记录
              </Button>
            </Group>
          </Stack>
        </Modal>

        <PurchaseOrderReceiveModal
          opened={showReceiveModal}
          order={order}
          onClose={() => setShowReceiveModal(false)}
          onConfirm={handleReceiveWithEntries}
          isLoading={receiveMutation.isPending}
        />
      </Stack>
    </Container>
  );
};

export default PurchaseOrderDetailPage;
