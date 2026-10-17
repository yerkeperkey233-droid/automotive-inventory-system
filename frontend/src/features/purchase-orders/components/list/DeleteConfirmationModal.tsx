import React from 'react';
import { Modal, Stack, Text, Group, Button } from '@mantine/core';

interface DeleteConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  opened,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="删除采购订单"
      centered
    >
      <Stack>
        <Text>确定删除该采购订单吗？此操作无法撤销。</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            取消
          </Button>
          <Button
            color="red"
            loading={isLoading}
            onClick={onConfirm}
          >
            删除
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
