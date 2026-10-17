import React from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/router/route-paths';
import { ProductHeader } from '@/features/products/components/shared/ProductHeader';
import { getErrorMessage } from '@shared/utils/errors';
import { ManagerUserForm, type ManagerUserFormValues } from '../components/ManagerUserForm';
import { useCreateManagedUser } from '../manager.hooks';

const ManagerUserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateManagedUser();
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
      password: (value) => (value.length < 8 ? '密码至少需要 8 个字符' : null),
    },
  });

  const handleSubmit = async (values: ManagerUserFormValues) => {
    await createMutation.mutateAsync(values);
    navigate(ROUTES.managerUsers);
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <ProductHeader
          title="创建用户"
          subtitle="只有超级管理员可以创建和管理用户。"
        />
        <ManagerUserForm
          form={form}
          errorMessage={createMutation.error ? getErrorMessage(createMutation.error) : null}
          isSubmitting={createMutation.isPending}
          submitLabel="创建用户"
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.managerUsers)}
        />
      </Stack>
    </Container>
  );
};

export default ManagerUserCreatePage;
