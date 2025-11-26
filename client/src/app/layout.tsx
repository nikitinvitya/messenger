import '@mantine/core/styles.css';
import type {Metadata} from 'next';
import {ColorSchemeScript} from '@mantine/core';
import React from "react";
import '@/app/styles/index.scss'
import {AppProvider} from "@/app/providers";
import { roboto } from '@/app/styles/fonts/fonts';

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
    <html lang="en" suppressHydrationWarning className={roboto.variable}>
    <head>
      <ColorSchemeScript/>
      <title>Messenger</title>
    </head>
    <body>
      <AppProvider>
        {children}
      </AppProvider>
    </body>
    </html>
  );
}