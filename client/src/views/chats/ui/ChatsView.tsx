'use client'

import classNames from 'classnames';
import cls from './ChatsView.module.scss'
import {Box} from "@mantine/core";
import {ChatList} from "@/widgets/chat-list";
import {ChatListHeader} from "@/widgets/chat-list-header";
import {useState} from "react";
import {Chat} from "@/entities/chat";
import {UserSearchResponse} from "@/entities/user/model/model";
import {UserSearchResult} from "@/widgets/user-search-result/ui/UserSearchResult";

interface ChatsViewProps {
  chats: Chat[];
  className?: string;
}

export const ChatsView = ({chats}: ChatsViewProps) => {
  const [isActiveSearch, setIsActiveSearch] = useState<boolean>(false)
  const [userSearchResult, setUserSearchResult] = useState<UserSearchResponse[]>([])

  return (
    <Box className={classNames(cls.chatsView)}>
      <ChatListHeader setSearchResults={setUserSearchResult} setIsActiveSearch={setIsActiveSearch} isActiveSearch={isActiveSearch}/>
      {isActiveSearch ?
        <UserSearchResult users={userSearchResult} />
      :
        <ChatList chatList={chats} />
      }
    </Box>
  );
};

