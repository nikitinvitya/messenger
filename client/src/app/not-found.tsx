'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/entities/user';
import { AppRoutes } from '@/shared/config/routes';

export default function NotFound() {
  const router = useRouter();
  const { user, isLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace(AppRoutes.chats);
    } else {
      router.replace(AppRoutes.login);
    }
  }, [user, isLoading, router]);

  return null;
}