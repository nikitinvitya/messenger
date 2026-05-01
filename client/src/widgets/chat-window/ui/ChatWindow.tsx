'use client';

import { useEffect } from 'react';
import classNames from 'classnames';
import { Box, Button, Text } from '@mantine/core';
import {type Message, MessageApiResponse, useMessageStore} from '@/entities/message';
import { ChatHeader } from '@/widgets/chat-header';
import { MessageList } from '@/widgets/message-list';
import { SendMessageForm } from '@/features/send-message';
import wallpaper from '@/shared/assets/ChatWallpaper.jpg';
import { type Chat } from '@/entities/chat';
import { websocketService } from '@/shared/api/websocket';
import cls from './ChatWindow.module.scss';


interface ChatWindowProps {
  className?: string;
  initialMessages: Message[];
  blockStatus: MessageApiResponse["blockStatus"];
  chatID: number;
  chatName: string;
  chatType: Chat["type"];
}

export const ChatWindow = (props: ChatWindowProps) => {
  const { chatID, chatName, className, initialMessages, blockStatus, chatType } = props;

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
    <Box className={classNames(cls.chatWindow)} style={{backgroundImage: `url(${wallpaper.src})`}}>
      <ChatHeader chatName={chatName} chatID={chatID}/>
      <MessageList
        chatType={chatType}
        initialMessages={initialMessages} />

      <Box className={cls.blurFooter} />
      {renderFooter()}
    </Box>
  );
};
