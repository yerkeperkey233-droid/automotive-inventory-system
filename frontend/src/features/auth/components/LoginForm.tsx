import React from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { getErrorMessage } from '@/shared/utils/errors';
import { IconAlertCircle } from '@tabler/icons-react';
import { useLogin } from '../auth.hooks';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) =>
        value.length === 0 ? '请输入用户名' : null,
      password: (value) =>
        value.length === 0 ? '请输入密码' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await loginMutation.mutateAsync(values);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      form.setFieldError('', getErrorMessage(error));
    }
  };

  const errorMessage = form.values
    ? (form.errors as any)['']
    : null;

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="lg">
        {errorMessage && (
          <Alert icon={<IconAlertCircle size={16} />} c="red">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="用户名"
              placeholder="请输入用户名"
              {...form.getInputProps('username')}
              disabled={loginMutation.isPending}
            />

            <PasswordInput
              label="密码"
              placeholder="请输入密码"
              {...form.getInputProps('password')}
              disabled={loginMutation.isPending}
            />

            <Button
              type="submit"
              fullWidth
              loading={loginMutation.isPending}
            >
              登录
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
};

export default LoginForm;
