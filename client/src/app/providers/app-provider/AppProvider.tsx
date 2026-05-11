'use client';

import {type ReactNode, useEffect} from 'react';
import {MantineProvider} from '@mantine/core';
import {SessionProvider} from '../session-provider/SessionProvider';
import {requestNotificationPermission} from "@/shared/lib/showNotification";

export function AppProvider({
                              children,
                            }: {
  children: ReactNode;
}) {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <MantineProvider >
      <SessionProvider >
        {children}
      </SessionProvider>
    </MantineProvider>
  );
}