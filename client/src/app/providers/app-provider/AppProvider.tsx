'use client';

import {type ReactNode} from 'react';
import {MantineProvider} from '@mantine/core';
import {SessionProvider} from '../session-provider/SessionProvider';

export function AppProvider({
                              children,
                            }: {
  children: ReactNode;
}) {
  return (
    <MantineProvider >
      <SessionProvider >
        {children}
      </SessionProvider>
    </MantineProvider>
    );
}