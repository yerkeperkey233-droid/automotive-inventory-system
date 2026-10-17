import React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';

export interface ManagerUserFormValues {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  is_superuser: boolean;
  is_active: boolean;
}

interface ManagerUserFormProps {
  form: UseFormReturnType<ManagerUserFormValues>;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (values: ManagerUserFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export const ManagerUserForm: React.FC<ManagerUserFormProps> = ({
  form,
  errorMessage,
  isSubmitting = false,
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  return (
    <Paper p="lg" radius="md" withBorder>
      {errorMessage ? (
        <Alert icon={<IconAlertCircle size={16} />} c="red" mb="lg">
          {errorMessage}
        </Alert>
      ) : null}

      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="md">
          <Group grow align="flex-start">
            <TextInput
              label="用户名"
              placeholder="请输入用户名"
              withAsterisk
              disabled={isSubmitting}
              {...form.getInputProps('username')}
            />
            <TextInput
              label="邮箱"
              placeholder="请输入邮箱"
              withAsterisk
              disabled={isSubmitting}
              {...form.getInputProps('email')}
            />
          </Group>

          <Group grow align="flex-start">
            <TextInput
              label="名"
              placeholder="请输入名字"
              disabled={isSubmitting}
              {...form.getInputProps('first_name')}
            />
            <TextInput
              label="姓"
              placeholder="请输入姓氏"
              disabled={isSubmitting}
              {...form.getInputProps('last_name')}
            />
          </Group>

          <PasswordInput
            label="密码"
            placeholder="请输入密码"
            disabled={isSubmitting}
            {...form.getInputProps('password')}
          />

          <Switch
            label="启用账号"
            description="停用的账号仍保留在系统中，但无法登录。"
            disabled={isSubmitting}
            {...form.getInputProps('is_active', { type: 'checkbox' })}
          />

          <Checkbox
            label="授予超级管理员权限"
            description="超级管理员可访问用户管理页面并编辑其他用户。"
            disabled={isSubmitting}
            {...form.getInputProps('is_superuser', { type: 'checkbox' })}
          />

          <Group justify="flex-end" pt="xl">
            <Button type="button" variant="light" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};
