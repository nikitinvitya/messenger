'use client';

import { useUserStore } from '@/entities/user';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { AppRoutes } from '@/shared/config/routes';
import { Loader } from '@mantine/core';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push(AppRoutes.login);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <Loader />;
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
};