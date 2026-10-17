import React from 'react';
import {
  NavLink,
  Stack,
  Divider,
  Text,
  Badge,
  Box,
  ScrollArea,
  Group,
} from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/features/auth/auth-context';
import { NAV_ITEMS } from '@/shared/constants/navigation';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperuser } = useAuthContext();

  return (
    <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
      <Box p="md">
        <Group gap="xs" mb="lg" align="center">
          <Text size="lg" fw={700} component="span">
            库存管理
          </Text>
          <Badge size="sm" variant="light">
            版本 1.0
          </Badge>
        </Group>

        <Divider my="lg" />

        <Stack gap={8}>
          {NAV_ITEMS.filter((item) => !item.superuserOnly || isSuperuser).map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/');

            return (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={<Icon size={18} />}
                active={isActive}
                onClick={() => navigate(item.href)}
                styles={{
                  root: {
                    borderRadius: 6,
                    paddingLeft: 16,
                    paddingRight: 16,
                  },
                }}
              />
            );
          })}
        </Stack>
      </Box>
    </ScrollArea>
  );
};

export default Sidebar;
