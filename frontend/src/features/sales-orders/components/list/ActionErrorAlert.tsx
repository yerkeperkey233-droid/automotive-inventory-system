import React from 'react';
import { Alert, Button, Group, Modal, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ActionErrorAlertProps {
  opened: boolean;
  message: string;
  onClose: () => void;
}

export const ActionErrorAlert: React.FC<ActionErrorAlertProps> = ({
  opened,
  message,
  onClose,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="无法执行该操作" centered>
      <Stack>
        <Alert icon={<IconAlertCircle size={16} />} c="red">
          {message}
        </Alert>
        <Group justify="flex-end">
          <Button color="blue" onClick={onClose}>
            确定
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
