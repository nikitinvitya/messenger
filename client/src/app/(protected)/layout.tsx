import { ReactNode } from 'react';
import { AuthGuard } from "@/app/providers";
import { Box } from "@mantine/core";
import { getChats } from "@/entities/chat/api/getChats";
import { Sidebar } from "@/widgets/sidebar";
import { ProtectedContent } from './ProtectedContent';
import cls from './ProtectedLayout.module.scss';

interface LayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

export default async function ProtectedLayout({ children, modal }: LayoutProps) {
  const chats = await getChats();

  return (
    <AuthGuard>
      <Box className={cls.layoutWrapper}>
        <Sidebar initialChats={chats} />

        <ProtectedContent>
          {children}
        </ProtectedContent>

        {modal}
      </Box>
    </AuthGuard>
  );
}