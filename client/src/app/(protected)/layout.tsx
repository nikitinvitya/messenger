import {ReactNode} from 'react';
import {AuthGuard} from "@/app/providers";
import {Box} from "@mantine/core";

interface LayoutProps {
  children: ReactNode;
  modal: ReactNode;
}

export default function ProtectedLayout({children, modal}: LayoutProps) {
  return (
    <AuthGuard>
      <Box style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {children}

        {modal}
      </Box>
    </AuthGuard>
  );
}