import React from 'react';
import { Badge, BadgeProps } from '@mantine/core';

type StatusType = 'pending' | 'received' | 'shipped' | 'cancelled' | 'draft' | 'active' | 'confirmed';

const STATUS_VARIANTS: Record<StatusType, { color: string; label: string }> = {
  pending: { color: 'yellow', label: '待处理' },
  received: { color: 'green', label: '已收货' },
  shipped: { color: 'blue', label: '已发货' },
  cancelled: { color: 'red', label: '已取消' },
  draft: { color: 'gray', label: '草稿' },
  active: { color: 'green', label: '已启用' },
  confirmed: { color: 'blue', label: '已确认' },
};

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: StatusType;
  variant?: 'dot' | 'filled' | 'outline' | 'light';
}

export const normalizeStatus = (status: string): StatusType => {
  const normalized = status.toLowerCase();

  if (normalized === 'pending') {
    return 'draft';
  }

  if (normalized in STATUS_VARIANTS) {
    return normalized as StatusType;
  }

  return 'pending';
};

export const getStatusLabel = (status: string): string =>
  STATUS_VARIANTS[normalizeStatus(status)].label;

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'light',
  ...props
}) => {
  const normalizedStatus = normalizeStatus(status);
  const config = STATUS_VARIANTS[normalizedStatus];

  return (
    <Badge color={config.color} variant={variant} {...props}>
      {config.label}
    </Badge>
  );
};
