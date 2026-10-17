import React from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/zh-cn';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { appTheme } from './theme';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <MantineProvider theme={appTheme}>
      <DatesProvider settings={{ locale: 'zh-cn', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </DatesProvider>
    </MantineProvider>
  );
};
