import '@mantine/core/styles.css';
import type {Metadata} from 'next';
import {ColorSchemeScript, MantineProvider} from '@mantine/core';
import React from "react";
import '@/app/styles/index.scss'

export const metadata: Metadata = {
  title: 'Messenger',
  description: 'Messenger',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <ColorSchemeScript/>
    </head>
    <body>
    <MantineProvider>{children}</MantineProvider>
    </body>
    </html>
  );
}