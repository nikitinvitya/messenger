'use client'

import { useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import {Box} from "@mantine/core";
import { Chat, ChatListItem } from "@/entities/chat";
import { useChatStore } from "@/entities/chat/model/store";
import cls from './ChatList.module.scss';

interface ChatListProps {
  className?: string;
  chatList: Chat[];
}

type ChatWithMessages = Chat & {
  lastMessage: NonNullable<Chat['lastMessage']>
}

export const ChatList = ({ chatList, className }: ChatListProps) => {
  const { chats, setChats } = useChatStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (chatList && !isInitialized.current) {
      setChats(chatList);
      isInitialized.current = true;
    }
  }, [chatList, setChats]);

  const sortedAndFilteredChats = useMemo(() => {
    return chats
      .filter((chat): chat is ChatWithMessages =>
        chat.lastMessage !== undefined && chat.lastMessage !== null
      )
      .sort((a, b) => {
        const timeA = new Date(a.lastMessage.createdAt).getTime();
        const timeB = new Date(b.lastMessage.createdAt).getTime();
        return timeB - timeA;
      });
  }, [chats]);

  return (
    <Box className={classNames(cls.chatList, className)}>
      {sortedAndFilteredChats.map(chat => (
        <ChatListItem chatInfo={chat} key={chat.id} />
      ))}
      {sortedAndFilteredChats.length === 0 && (
        <Box className={cls.emptyChatList}>There is no chats yet</Box>
      )}
    </Box>
  );
};