import React from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { ProductHeader } from '@/features/products/components/shared/ProductHeader';
import { ErrorState } from '@components/ui/ErrorState';
import { LoadingState } from '@components/ui/LoadingState';
import { getErrorMessage } from '@shared/utils/errors';
import { ManagerUserForm, type ManagerUserFormValues } from '../components/ManagerUserForm';
import { useManagedUser, useUpdateManagedUser } from '../manager.hooks';

const ManagerUserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = id ? parseInt(id, 10) : null;
  const userQuery = useManagedUser(userId);
  const updateMutation = useUpdateManagedUser();
  const form = useForm<ManagerUserFormValues>({
    initialValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      is_superuser: false,
      is_active: true,
    },
    validate: {
      email: (value) => (value.trim().length === 0 ? '请输入邮箱' : null),
      username: (value) => (value.trim().length === 0 ? '请输入用户名' : null),
      password: (value) =>
        value.length > 0 && value.length < 8 ? '密码至少需要 8 个字符' : null,
    },
  });
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    initializedRef.current = false;
  }, [userId]);

  React.useEffect(() => {
    if (userQuery.data && !initializedRef.current) {
      form.setValues({
        email: userQuery.data.email || '',
        username: userQuery.data.username || '',
        first_name: userQuery.data.first_name || '',
        last_name: userQuery.data.last_name || '',
        password: '',
        is_superuser: userQuery.data.is_superuser,
        is_active: userQuery.data.is_active,
      });
      initializedRef.current = true;
    }
  }, [form, userQuery.data]);

  const handleSubmit = async (values: ManagerUserFormValues) => {
    if (!userId) return;

    await updateMutation.mutateAsync({
      id: userId,
      payload: {
        email: values.email,
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        is_superuser: values.is_superuser,
        is_active: values.is_active,
        ...(values.password ? { password: values.password } : {}),
      },
    });

    navigate(ROUTES.managerUsers);
  };

  if (userQuery.isLoading) {
    return <LoadingState message="正在加载用户…" />;
  }

  if (userQuery.isError || !userQuery.data) {
    return <ErrorState message="加载用户失败" onRetry={() => userQuery.refetch()} />;
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <ProductHeader
          title="编辑用户"
          subtitle={`修改 ${userQuery.data.username} 的账号权限。`}
        />
        <ManagerUserForm
          form={form}
          errorMessage={updateMutation.error ? getErrorMessage(updateMutation.error) : null}
          isSubmitting={updateMutation.isPending}
          submitLabel="保存修改"
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.managerUsers)}
        />
      </Stack>
    </Container>
  );
};

export default ManagerUserEditPage;
