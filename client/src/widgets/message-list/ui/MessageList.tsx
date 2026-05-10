'use client';

import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Box } from '@mantine/core';
import { type Chat } from '@/entities/chat';
import { MessageItem, useMessageStore, type Message } from '@/entities/message';
import { websocketService } from "@/shared/api/websocket";
import cls from './MessageList.module.scss';

interface MessageListProps {
  className?: string;
  initialMessages: Message[];
  chatType: Chat['type'];
}

export const MessageList = ({ initialMessages, chatType }: MessageListProps) => {
  const messages = useMessageStore((state) => state.messages);
  const setInitialMessages = useMessageStore((state) => state.setInitialMessages);
  const viewport = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    setInitialMessages(initialMessages);

    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 30);

    return () => clearTimeout(timer);
  }, [initialMessages, setInitialMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      websocketService.sendReadMessages(last.chatId, last.id);

      const timer = setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const messagesWithMeta = messages.map((msg, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const GAP = 5 * 60 * 1000;

    const timeGapPrev = prev ? new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() : Infinity;
    const timeGapNext = next ? new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime() : Infinity;

    const isFirstOfGroup = !prev || prev.sender?.id !== msg.sender?.id || timeGapPrev > GAP || prev.type === 'system';
    const isLastOfGroup = !next || next.sender?.id !== msg.sender?.id || timeGapNext > GAP || next.type === 'system';

    return { ...msg, isFirstOfGroup, isLastOfGroup };
  });

  return (
    <Box ref={viewport} className={classNames(cls.messageList)}>
      {messagesWithMeta.map((message) => (
        <MessageItem
          key={message.id}
          messageInfo={message}
          isFirstOfGroup={message.isFirstOfGroup}
          isLastOfGroup={message.isLastOfGroup}
          chatType={chatType}
        />
      ))}
      <Box className={cls.listSpacer} />
      <div ref={bottomRef} style={{ float: "left", clear: "both" }} />
    </Box>
  );
};