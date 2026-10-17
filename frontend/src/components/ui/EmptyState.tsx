import React from 'react';
import { Center, Stack, Text, Button } from '@mantine/core';
import { IconFileOff, IconPlus } from '@tabler/icons-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  fullHeight?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '暂无内容',
  icon = <IconFileOff size={48} color="gray" />,
  actionLabel,
  onAction,
  fullHeight = true,
}) => {
  return (
    <Center style={{ minHeight: fullHeight ? 300 : 'auto', flexDirection: 'column' }}>
      <Stack align="center" gap={16} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 16 }}>{icon}</div>
        <Stack gap={0} align="center">
          <Text size="lg" fw={600}>
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
        {actionLabel && onAction && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={onAction}
            mt={8}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
};
