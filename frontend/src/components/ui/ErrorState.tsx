import React from 'react';
import { Alert, Button, Center, Stack } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullHeight?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = '加载数据时发生错误',
  onRetry,
  fullHeight = true,
}) => {
  return (
    <Center style={{ minHeight: fullHeight ? 300 : 'auto', flexDirection: 'column' }}>
      <Stack align="center" gap={16} style={{ maxWidth: 400 }}>
        <Alert icon={<IconAlertCircle size={16} />} c="red" title="错误">
          {message}
        </Alert>
        {onRetry && (
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={onRetry}
            variant="light"
          >
            重试
          </Button>
        )}
      </Stack>
    </Center>
  );
};
