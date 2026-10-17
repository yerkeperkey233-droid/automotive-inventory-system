import React from 'react';
import { ActionIcon, Badge, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { DataTable } from '@components/ui/DataTable';
import { ListTableCard } from '@components/ui/ListTableCard';
import type { ManagedUser } from '../manager.types';

interface ManagerUsersTableProps {
  users: ManagedUser[];
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

export const ManagerUsersTable: React.FC<ManagerUsersTableProps> = ({
  users,
  onEdit,
  onDelete,
}) => {
  const columns = [
    { key: 'username', label: '用户名', width: '20%', align: 'center' as const },
    { key: 'email', label: '邮箱', width: '26%', align: 'center' as const },
    {
      key: 'full_name',
      label: '名称',
      width: '24%',
      align: 'center' as const,
      render: (_value: unknown, row: ManagedUser) =>
        `${row.first_name || ''} ${row.last_name || ''}`.trim() || '未填写姓名',
    },
    {
      key: 'is_superuser',
      label: '角色',
      width: '15%',
      align: 'center' as const,
      render: (value: boolean) => (
        <Badge color={value ? 'violet' : 'blue'} variant="light">
          {value ? '超级管理员' : '普通用户'}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      label: '状态',
      width: '15%',
      align: 'center' as const,
      render: (value: boolean) => (
        <Badge color={value ? 'green' : 'gray'} variant="light">
          {value ? '已启用' : '已停用'}
        </Badge>
      ),
    },
  ];

  return (
    <ListTableCard>
      <DataTable
        columns={columns}
        data={users}
        actionsColumnWidth={100}
        renderRowActions={(row: ManagedUser) => (
          <Group gap={4} wrap="nowrap" justify="center">
            <Tooltip label="编辑用户">
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row);
                }}
              >
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="删除用户">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      />
    </ListTableCard>
  );
};
