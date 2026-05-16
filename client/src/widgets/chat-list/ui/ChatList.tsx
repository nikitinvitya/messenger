'use client'

import { useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { Box } from "@mantine/core";
import { Chat, ChatListItem } from "@/entities/chat";
import { isSavedChat } from "@/entities/chat/lib/savedChat";
import { useChatStore } from "@/entities/chat/model/store";
import cls from './ChatList.module.scss';

interface ChatListProps {
  className?: string;
  chatList: Chat[];
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

  const sortedChats = useMemo(() => {
    return [...chats]
      .filter((chat) => isSavedChat(chat) || chat.lastMessage != null)
      .sort((a, b) => {
        if (isSavedChat(a) && !isSavedChat(b)) return -1;
        if (isSavedChat(b) && !isSavedChat(a)) return 1;

        const timeA = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : new Date(a.createdAt).getTime();
        const timeB = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [chats]);

  return (
    <Box className={classNames(cls.chatList, className)}>
      {sortedChats.map(chat => (
        <ChatListItem chatInfo={chat} key={chat.id} />
      ))}
      {sortedChats.length === 0 && (
        <Box className={cls.emptyChatList}>There is no chats yet</Box>
      )}
    </Box>
  );
};
