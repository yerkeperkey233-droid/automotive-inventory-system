import React from 'react';
import { ListPageHeader } from '@components/ui/ListPageHeader';

interface ManagerUsersToolbarProps {
  userCount: number;
  onCreate: () => void;
}

export const ManagerUsersToolbar: React.FC<ManagerUsersToolbarProps> = ({
  userCount,
  onCreate,
}) => {
  return (
    <ListPageHeader
      title="用户管理"
      itemCount={userCount}
      itemLabel="user"
      actionLabel="新增用户"
      onAction={onCreate}
    />
  );
};
