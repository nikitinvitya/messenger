'use client'

import classNames from 'classnames';
import { Box, Text } from "@mantine/core";
import { usePathname } from 'next/navigation';
import { useUserStore } from "@/entities/user";
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { formatDate } from "@/shared/lib/formatDate";
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";
import { SavedMessagesAvatar } from "@/shared/ui/SavedMessagesAvatar/ui/SavedMessagesAvatar";
import { Chat } from "@/entities/chat/model/model";
import { getChatDisplayName, isSavedChat } from "@/entities/chat/lib/savedChat";

import cls from './ChatListItem.module.scss';

interface ChatItemProps {
  className?: string;
  chatInfo: Chat;
}

export const ChatListItem = ({ chatInfo, className }: ChatItemProps) => {
  const pathname = usePathname();
  const currentUser = useUserStore((state) => state.user);
  const isActive = pathname === `/chats/${chatInfo.id}`;
  const saved = isSavedChat(chatInfo);

  const partner = chatInfo.type === 'private'
    ? chatInfo.participants?.find(p => p.id !== currentUser?.id)
    : null;

  const chatName = getChatDisplayName(chatInfo, currentUser?.id);
  const isOnline = chatInfo.type === 'private' && partner ? !!partner.isOnline : false;

  const lastMessagePreview = chatInfo.lastMessage?.content
    ? chatInfo.lastMessage.content
    : chatInfo.lastMessage
      ? 'Photo'
      : saved
        ? 'No messages yet'
        : '';

  const timeLabel = chatInfo.lastMessage?.createdAt ?? (saved ? chatInfo.createdAt : undefined);

  return (
    <AppLink
      href={`/chats/${chatInfo.id}`}
      className={classNames(cls.link, isActive && cls.linkActive, className)}
    >
      <Box className={cls.chatItem}>
        {saved ? (
          <SavedMessagesAvatar size={50} />
        ) : (
          <AppAvatar
            src={chatInfo.type === 'private' ? partner?.avatarURL : chatInfo.avatarURL}
            name={chatName}
            isOnline={isOnline}
            size={50}
          />
        )}

        <Text className={cls.chatName} truncate="end">
          {chatName}
        </Text>

        {timeLabel && (
          <Text className={cls.time}>
            {formatDate(timeLabel)}
          </Text>
        )}

        {lastMessagePreview && (
          <Text className={cls.lastMessage} truncate="end">
            {lastMessagePreview}
          </Text>
        )}

        {!saved && chatInfo.unreadCount > 0 && (
          <Box className={cls.unreadBadge}>
            {chatInfo.unreadCount}
          </Box>
        )}
      </Box>
    </AppLink>
  );
};
