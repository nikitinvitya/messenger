import { type ReactNode } from 'react';
import {AuthGuard} from "@/app/providers";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}