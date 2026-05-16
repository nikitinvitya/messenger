'use client';

import { useUserStore } from '@/entities/user';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { AppRoutes } from '@/shared/config/routes';
import { Center, Loader } from '@mantine/core';

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
    return (
      <Center h="100vh" w="100%">
        <Loader size="md" />
      </Center>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return null;
};