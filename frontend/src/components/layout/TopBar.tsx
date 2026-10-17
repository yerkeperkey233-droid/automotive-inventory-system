import React, { startTransition } from 'react';
import {
  Box,
  Group,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconLogout, IconSun, IconMoon } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMantineColorScheme } from '@mantine/core';
import { ROUTES } from '@/app/router/route-paths';
import { useLogout } from '@/features/auth/auth.hooks';

const TopBar: React.FC = () => {
  const logout = useLogout();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    await logout.mutateAsync();
    startTransition(() => {
      navigate(ROUTES.login, { replace: true });
    });
  };

  return (
    <Box h={60} p="md" style={{ background: 'white', borderBottom: '1px solid #e9ecef' }}>
      <Group justify="space-between" h="100%">
        <div />

        <Group>
          <Tooltip label={colorScheme === 'dark' ? '浅色模式' : '深色模式'}>
            <ActionIcon
              onClick={() => toggleColorScheme()}
              variant="default"
              size="lg"
              radius="md"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Tooltip>

          <ActionIcon
            onClick={handleLogout}
            variant="light"
            color="red"
            size="lg"
            radius="md"
            title="退出登录"
          >
            <IconLogout size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
};

export default TopBar;
