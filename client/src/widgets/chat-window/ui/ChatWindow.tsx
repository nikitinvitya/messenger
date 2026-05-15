'use client';

import { useEffect } from 'react';
import classNames from 'classnames';
import { Box, Button, Text, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type Message, MessageApiResponse, useMessageStore } from '@/entities/message';
import { ChatHeader } from '@/widgets/chat-header';
import { MessageList } from '@/widgets/message-list';
import { SendMessageForm } from '@/features/send-message';
import { GroupInfo } from '@/widgets/group-info';
import wallpaperLight from '@/shared/assets/ChatWallpaper.jpg';
import wallpaperDark from '@/shared/assets/ChatWallpaperDark.jpg';
import { type Chat } from '@/entities/chat';
import cls from './ChatWindow.module.scss';
import Image from "next/image";

interface ChatWindowProps {
  chatID: number;
  chatName: string;
  initialMessages: Message[];
  blockStatus: MessageApiResponse["blockStatus"];
  chatType: Chat["type"];
  partnerAvatar: string | undefined;
  partnerUsername: string | undefined;
  initialIsOnline: boolean;
  initialParticipantsCount: number;
  initialGroupAvatar?: string;
}

export const ChatWindow = (props: ChatWindowProps) => {
  const colorScheme = useComputedColorScheme('light');
  const wallpaper = colorScheme === 'dark' ? wallpaperDark : wallpaperLight;

  const {
    chatID,
    chatName,
    initialMessages,
    blockStatus,
    chatType,
    partnerUsername,
    partnerAvatar,
    initialIsOnline,
    initialParticipantsCount,
    initialGroupAvatar
  } = props;

  const [infoOpened, { toggle: toggleInfo, close: closeInfo }] = useDisclosure(false);
  const clearMessages = useMessageStore((state) => state.clearMessages);

  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [chatID, clearMessages]);

  const renderFooter = () => {
    switch (blockStatus) {
      case "recipient_blocked":
        return <Button>Unblock</Button>
      case "sender_blocked":
        return <Text>You are blocked</Text>
      default:
        return <SendMessageForm chatID={chatID} key={chatID} />
    }
  }

  return (
    <Box className={classNames(cls.chatWindow)}>
      <Box className={cls.mainSection}>
        <Image
          src={wallpaper}
          alt="Background"
          fill
          priority={true}
          unoptimized
          className={cls.wallpaper}
        />
        <ChatHeader
          chatName={chatName}
          chatID={chatID}
          chatType={chatType}
          partnerAvatar={partnerAvatar}
          partnerUsername={partnerUsername}
          isOnline={initialIsOnline}
          initialParticipantsCount={initialParticipantsCount}
          initialGroupAvatar={initialGroupAvatar}
          onToggleInfo={toggleInfo}
        />
        <Box className={cls.messagesWrapper}>
          <MessageList
            chatType={chatType}
            initialMessages={initialMessages} />
        </Box>

        <Box className={cls.footerContainer}>
          {renderFooter()}
        </Box>
      </Box>

      {chatType === 'group' && (
        <GroupInfo
          chatID={chatID}
          opened={infoOpened}
          onClose={closeInfo}
        />
      )}
    </Box>
  );
};