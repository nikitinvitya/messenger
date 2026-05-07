'use client'

import { usePathname } from 'next/navigation';
import classNames from 'classnames';
import cls from './ProtectedLayout.module.scss';
import { ReactNode } from 'react';

export const ProtectedContent = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  const isChatOpen = pathname !== '/chats' && pathname.startsWith('/chats/');

  return (
    <main className={classNames(cls.mainContent, { [cls.active]: isChatOpen })}>
      {children}
    </main>
  );
};