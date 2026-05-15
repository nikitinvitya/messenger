'use client';

import { type ReactNode, useEffect } from 'react';
import {
  MantineProvider,
  localStorageColorSchemeManager,
} from '@mantine/core';
import { SessionProvider } from '../session-provider/SessionProvider';
import { requestNotificationPermission } from '@/shared/lib/showNotification';
import { COLOR_SCHEME_STORAGE_KEY } from '@/shared/constants/color-scheme';
import { messengerTheme } from '@/shared/theme/mantine-theme';

const colorSchemeManager = localStorageColorSchemeManager({
  key: COLOR_SCHEME_STORAGE_KEY,
});

export function AppProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <MantineProvider
      theme={messengerTheme}
      defaultColorScheme="light"
      colorSchemeManager={colorSchemeManager}
    >
      <SessionProvider>{children}</SessionProvider>
    </MantineProvider>
  );
}