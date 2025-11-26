'use client'

import classNames from 'classnames';
import cls from './ChatListItem.module.scss'
import {Chat} from "@/entities/chat/model/model";
import {Box, Text} from "@mantine/core";
import {useUserStore} from "@/entities/user";
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";
import {formatDate} from "@/shared/lib/formatDate";

type ChatWithMessages = Chat & {
  lastMessage: NonNullable<Chat['lastMessage']>
}

interface ChatItemProps {
  className?: string;
  chatInfo: ChatWithMessages,
}

export const ChatListItem = ({chatInfo}: ChatItemProps) => {
  console.log(chatInfo)
  const currentUser = useUserStore((state) => state.user)

  const getChatName = (): string => {
    if (chatInfo.type === 'group' && chatInfo.name) {
      return chatInfo.name;
    }

    if (chatInfo.type === 'private' && currentUser) {
      const partner = chatInfo.participants.find(p => p.id !== currentUser.id);
      if (partner) {
        return partner.username;
      }
    }

    if (chatInfo.participants.length === 1 && currentUser && chatInfo.participants[0].id === currentUser.id) {
      return "Saved Messages";
    }

    return "Unknown";
  }


  return (
    <AppLink href={`/chats/${chatInfo.id}`}>
      <Box className={classNames(cls.chatItem)}>
        <Text className={cls.chatName}>{getChatName()}</Text>
        <Text className={cls.time}>
          {formatDate(chatInfo.lastMessage.createdAt)}
        </Text>
        <Text className={cls.lastMessage}>{chatInfo.lastMessage.content}</Text>
      </Box>
    </AppLink>
  );
};

