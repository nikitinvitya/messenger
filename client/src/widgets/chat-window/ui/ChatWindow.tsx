'use client';

import { useEffect } from 'react';
import classNames from 'classnames';
import { Box, useComputedColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { type Message, MessageApiResponse, useMessageStore } from '@/entities/message';
import { ChatHeader } from '@/widgets/chat-header';
import { MessageList } from '@/widgets/message-list';
import { ChatFooter } from '@/widgets/chat-footer';
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
  partnerUserID?: number;
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
    partnerUserID,
    initialIsOnline,
    initialParticipantsCount,
    initialGroupAvatar
  } = props;

  const [infoOpened, { toggle: toggleInfo, close: closeInfo }] = useDisclosure(false);
  const clearMessages = useMessageStore((state) => state.clearMessages);
  const setBlockStatus = useMessageStore((state) => state.setBlockStatus);

  useEffect(() => {
    setBlockStatus(blockStatus);
    return () => {
      clearMessages();
    };
  }, [chatID, blockStatus, setBlockStatus, clearMessages]);

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
          partnerUserID={partnerUserID}
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
          <ChatFooter chatID={chatID} partnerUserID={partnerUserID} />
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