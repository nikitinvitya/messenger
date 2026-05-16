import { ReactNode, Suspense } from 'react';
import { AuthGuard } from "@/app/providers";
import { Box } from "@mantine/core";
import { ProtectedContent } from './ProtectedContent';
import { SidebarWithChats } from './SidebarWithChats';
import { SidebarFallback } from './SidebarFallback';
import cls from './ProtectedLayout.module.scss';

interface LayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

export default function ProtectedLayout({ children, modal }: LayoutProps) {
  return (
    <AuthGuard>
      <Box className={cls.layoutWrapper}>
        <Suspense fallback={<SidebarFallback />}>
          <SidebarWithChats />
        </Suspense>

        <ProtectedContent>
          {children}
        </ProtectedContent>

        {modal}
      </Box>
    </AuthGuard>
  );
}