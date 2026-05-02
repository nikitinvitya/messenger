'use client'

import { useEffect, useMemo } from 'react';
import classNames from 'classnames';
import {Box, Group} from "@mantine/core";
import { Chat, ChatListItem } from "@/entities/chat";
import { useChatStore } from "@/entities/chat/model/store";
import cls from './ChatList.module.scss';

interface ChatListProps {
  className?: string;
  chatList: Chat[];
}

export const ChatList = ({ chatList, className }: ChatListProps) => {
  const { chats, setChats } = useChatStore();

  useEffect(() => {
    if (chatList) {
      setChats(chatList);
    }
  }, [chatList, setChats]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat): chat is Chat & { lastMessage: NonNullable<Chat["lastMessage"]> } =>
      chat.lastMessage !== undefined && chat.lastMessage !== null
    );
  }, [chats]);

  return (
    <Box className={classNames(cls.chatList, className)}>
      {filteredChats.map(chat => (
        <ChatListItem chatInfo={chat} key={chat.id} />
      ))}
      {filteredChats.length === 0 && (
        <Box className={cls.emptyChatList}>There is no chats yet</Box>
      )}
    </Box>
  );
};