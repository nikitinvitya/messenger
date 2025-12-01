'use client'

import classNames from 'classnames';
import cls from './MessageItem.module.scss'
import {Box, Text} from "@mantine/core";
import {Message} from "@/entities/message";
import {useUserStore} from "@/entities/user";
import {Chat} from "@/entities/chat";

interface MessageItemProps {
  className?: string;
  messageInfo: Message;
  chatType: Chat["type"];
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
}

export const MessageItem = (props: MessageItemProps) => {
  const { messageInfo, isLastOfGroup, isFirstOfGroup, chatType } = props;

  const currentUser = useUserStore((state) => state.user);
  const isCurrentUserMessage = currentUser?.id === messageInfo.sender.id;

  const wrapperClass = classNames(cls.messageWrapper, {
    [cls.myMessageWrapper]: isCurrentUserMessage,
  });

  const bubbleClass = classNames(cls.messageItem, {
    [cls.fromMe]: isCurrentUserMessage,
    [cls.fromThem]: !isCurrentUserMessage,
    [cls.tail]: isLastOfGroup,
    [cls.first]: isFirstOfGroup,
  });

  const isVisibleUsername = isFirstOfGroup && !isCurrentUserMessage && chatType === "group"

  const formatTime = (time: string) => new Date(time).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

  return (
    <div className={wrapperClass}>
      <Box className={bubbleClass}>
        {isVisibleUsername && (
          <Text className={cls.usernameInside}>{messageInfo.sender.username}</Text>
        )}
        <Text className={cls.messageContent}>{messageInfo.content}</Text>
        <Text className={cls.messageTime}>
          {formatTime(messageInfo.createdAt)}
        </Text>
      </Box>
    </div>
  );
};