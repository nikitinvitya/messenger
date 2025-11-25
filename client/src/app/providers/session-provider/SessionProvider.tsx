'use client'

import {useUserStore} from "@/entities/user";
import {ReactNode, useEffect} from "react";
import {usePathname, useRouter} from "next/navigation";
import {AppRoutes} from "@/shared/config/routes";

const SessionInitializer = () => {
  const { user, isLoading, fetchUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser().catch(console.error)
  }, []);

  const publicPaths = [AppRoutes.login, AppRoutes.signup];
  const isPublicPage = publicPaths.some(path => path === pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isPublicPage) {
      router.push(AppRoutes.login);
    }

    if (user && isPublicPage) {
      router.push(AppRoutes.chats);
    }
  }, [user, isLoading, pathname, isPublicPage, router]);

  return null;
};


export const SessionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SessionInitializer />
      {children}
    </>
  );
};