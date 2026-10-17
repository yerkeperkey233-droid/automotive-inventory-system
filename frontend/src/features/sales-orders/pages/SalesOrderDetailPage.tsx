import React, { useState } from 'react';
import { Button, Container, Group, Modal, Stack, Text } from '@mantine/core';
import type { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import {
  useCancelSalesOrder,
  useConfirmSalesOrderWithAllocations,
  useDeleteSalesOrder,
  useReopenSalesOrder,
  useSalesOrder,
} from '@features/sales-orders/salesOrders.hooks';
import type { ConfirmSalesOrderAllocationPayload } from '@features/sales-orders/salesOrder.types';
import { SalesOrderDetailHeader } from '../components/detail/SalesOrderDetailHeader';
import { SalesOrderDetailItems } from '../components/detail/SalesOrderDetailItems';
import { DeleteConfirmationModal } from '../components/list/DeleteConfirmationModal';
import { ActionErrorAlert } from '../components/list/ActionErrorAlert';
import { SalesOrderAllocationModal } from '../components/form/SalesOrderAllocationModal';

const SalesOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id ? parseInt(id, 10) : null;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenMessage, setReopenMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: '',
  });

  const query = useSalesOrder(orderId);
  const deleteMutation = useDeleteSalesOrder();
  const confirmMutation = useConfirmSalesOrderWithAllocations();
  const cancelMutation = useCancelSalesOrder();
  const reopenMutation = useReopenSalesOrder();

  const getErrorDetail = (error: unknown) => {
    const axiosError = error as AxiosError<{
      detail?: string;
      error?: string;
      requires_confirmation?: boolean;
      allocation_count?: number;
    }>;
    return axiosError.response?.data;
  };

  const handleDelete = async () => {
    if (!orderId) return;

    try {
      await deleteMutation.mutateAsync(orderId);
      navigate('/sales-orders');
    } catch (error) {
      console.error('删除失败：', error);
    }
  };

  const handleConfirmOrder = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setShowAllocationModal(true);
  };

  const handleConfirmWithAllocations = async (payload: ConfirmSalesOrderAllocationPayload) => {
    try {
      await confirmMutation.mutateAsync({ id: orderId!, payload });
      setShowAllocationModal(false);
      query.refetch();
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        '确认订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  const handleCancelOrder = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      await cancelMutation.mutateAsync(orderId!);
      query.refetch();
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        '取消订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  const handleReopenOrder = async (deleteAllocations = false) => {
    try {
      await reopenMutation.mutateAsync({ id: orderId!, deleteAllocations });
      setShowReopenModal(false);
      setReopenMessage('');
      await query.refetch();
    } catch (error) {
      const errorData = getErrorDetail(error);
      if (errorData?.requires_confirmation) {
        const count = errorData.allocation_count || 0;
        setReopenMessage(
          `该销售订单关联 ${count} 条库存分配记录，重新打开订单将删除这些记录。确定继续吗？`
        );
        setShowReopenModal(true);
        return;
      }
      const message =
        errorData?.detail ||
        errorData?.error ||
        '重新打开订单失败';
      setErrorAlert({ isOpen: true, message });
    }
  };

  if (query.isLoading) {
    return <LoadingState message="正在加载销售订单…" />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="加载销售订单失败" onRetry={() => query.refetch()} />;
  }

  const order = query.data;
  const items = order.items || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <SalesOrderDetailHeader
          order={order}
          onEdit={() => navigate(`/sales-orders/${order.id}/edit`)}
          onDelete={() => setShowDeleteModal(true)}
          onConfirm={handleConfirmOrder}
          onCancel={handleCancelOrder}
          onReopen={() => handleReopenOrder(false)}
          confirmLoading={confirmMutation.isPending}
          cancelLoading={cancelMutation.isPending}
          reopenLoading={reopenMutation.isPending}
        />

        <SalesOrderDetailItems items={items} orderStatus={order.status} />

        <Group justify="flex-end">
          <Button variant="light" onClick={() => navigate('/sales-orders')}>
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
          title="重新打开销售订单"
          centered
        >
          <Stack>
            <Text>{reopenMessage}</Text>
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowReopenModal(false)}>
                取消
              </Button>
              <Button loading={reopenMutation.isPending} color="orange" onClick={() => handleReopenOrder(true)}>
                重新打开并删除分配记录
              </Button>
            </Group>
          </Stack>
        </Modal>

        <SalesOrderAllocationModal
          opened={showAllocationModal}
          order={order}
          onClose={() => setShowAllocationModal(false)}
          onConfirm={handleConfirmWithAllocations}
          isLoading={confirmMutation.isPending}
        />
      </Stack>
    </Container>
  );
};

export default SalesOrderDetailPage;
