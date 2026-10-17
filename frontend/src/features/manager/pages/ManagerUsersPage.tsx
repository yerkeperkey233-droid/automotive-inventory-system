import React from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { ListPageLayout } from '@components/ui/ListPageLayout';
import { LoadingState } from '@components/ui/LoadingState';
import { getErrorMessage } from '@shared/utils/errors';
import { ManagerUsersTable } from '../components/ManagerUsersTable';
import { ManagerUsersToolbar } from '../components/ManagerUsersToolbar';
import { useDeleteManagedUser, useManagedUsers } from '../manager.hooks';
import type { ManagedUser } from '../manager.types';

const ManagerUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const usersQuery = useManagedUsers();
  const deleteMutation = useDeleteManagedUser();
  const [deleteModal, setDeleteModal] = React.useState<ManagedUser | null>(null);

  if (usersQuery.isLoading) {
    return <LoadingState message="正在加载用户列表…" />;
  }

  if (usersQuery.isError) {
    return <ErrorState message="加载用户列表失败" onRetry={() => usersQuery.refetch()} />;
  }

  const users = usersQuery.data?.results ?? [];
  const userCount = usersQuery.data?.count ?? users.length;
  const deleteErrorMessage = deleteMutation.error
    ? getErrorMessage(deleteMutation.error)
    : null;

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;

    await deleteMutation.mutateAsync(deleteModal.id);
    setDeleteModal(null);
  };

  return (
    <>
      <ListPageLayout
        header={
          <ManagerUsersToolbar
            userCount={userCount}
            onCreate={() => navigate(ROUTES.managerUserNew)}
          />
        }
      >
        {users.length === 0 ? (
          <EmptyState
            title="暂无用户"
            description="请在此页面创建用户。"
            actionLabel="创建用户"
            onAction={() => navigate(ROUTES.managerUserNew)}
          />
        ) : (
          <ManagerUsersTable
            users={users}
            onEdit={(user) => navigate(ROUTES.managerUserEdit(user.id))}
            onDelete={(user) => setDeleteModal(user)}
          />
        )}
      </ListPageLayout>

      <Modal
        opened={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="删除用户"
        centered
      >
        <Stack>
          <Text>
            确定删除用户{' '}
            <strong>{deleteModal?.username}</strong> 吗？此操作无法撤销。
          </Text>
          {deleteErrorMessage ? <Text c="red" size="sm">{deleteErrorMessage}</Text> : null}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteModal(null)}>
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
    </>
  );
};

export default ManagerUsersPage;
