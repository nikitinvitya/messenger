'use client'

import { useState } from 'react';
import { Box } from '@mantine/core';
import { ChatList } from '@/widgets/chat-list';
import { ChatListHeader } from '@/widgets/chat-list-header';
import { CreateGroupButton } from '@/features/create-group-button';
import { Chat } from '@/entities/chat';
import { UserSearchResponse } from '@/entities/user/model/model';
import cls from './Sidebar.module.scss';
import { usePathname } from 'next/navigation';
import classNames from 'classnames';
import {UserSearchResult} from "@/widgets/user-search-result";

interface SidebarProps {
  initialChats: Chat[];
}

export const Sidebar = ({ initialChats }: SidebarProps) => {
  const [isActiveSearch, setIsActiveSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResponse[]>([]);
  const pathname = usePathname();

  const isChatOpen = pathname.includes('/chats/') && pathname !== '/chats';

  return (
    <aside className={classNames(cls.sidebar, { [cls.hiddenOnMobile]: isChatOpen })}>
      <ChatListHeader
        isActiveSearch={isActiveSearch}
        setIsActiveSearch={setIsActiveSearch}
        setSearchResults={setSearchResults}
      />

      <Box className={cls.scrollArea}>
        {isActiveSearch ? (
          <UserSearchResult users={searchResults} />
        ) : (
          <ChatList chatList={initialChats} />
        )}
      </Box>

      {!isActiveSearch && <CreateGroupButton />}
    </aside>
  );
};