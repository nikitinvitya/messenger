'use client'

import classNames from 'classnames';
import { Box, Text, Group, Stack } from "@mantine/core";
import { useUserStore } from "@/entities/user";
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { formatDate } from "@/shared/lib/formatDate";
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";
import { Chat } from "@/entities/chat/model/model";

import cls from './ChatListItem.module.scss';

type ChatWithMessages = Chat & {
  lastMessage: NonNullable<Chat['lastMessage']>
}

interface ChatItemProps {
  className?: string;
  chatInfo: ChatWithMessages;
}

export const ChatListItem = ({ chatInfo, className }: ChatItemProps) => {
  const currentUser = useUserStore((state) => state.user);

  const partner = chatInfo.type === 'private'
    ? chatInfo.participants?.find(p => p.id !== currentUser?.id)
    : null;

  const getChatName = (): string => {
    if (chatInfo.type === 'group' && chatInfo.name) return chatInfo.name;
    if (partner) return partner.username;
    if (chatInfo.participants?.length === 1 && currentUser && chatInfo.participants[0].id === currentUser.id) {
      return "Saved Messages";
    }
    return "Unknown";
  };

  const avatarSrc = chatInfo.type === 'private' ? partner?.avatarURL : chatInfo.avatarURL;

  const isOnline = chatInfo.type === 'private' ? !!partner?.isOnline : false;

  const chatName = getChatName();

  return (
    <AppLink href={`/chats/${chatInfo.id}`} className={classNames(cls.link, className)}>
      <Box className={cls.chatItem}>
        <AppAvatar
          src={avatarSrc}
          name={chatName}
          isOnline={isOnline}
          size={50}
        />

        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="nowrap">
            <Text className={cls.chatName} truncate="end">
              {chatName}
            </Text>
            <Text className={cls.time}>
              {formatDate(chatInfo.lastMessage.createdAt)}
            </Text>
          </Group>

          <Text className={cls.lastMessage} truncate="end">
            {chatInfo.lastMessage.content}
          </Text>
        </Stack>
      </Box>
    </AppLink>
  );
};