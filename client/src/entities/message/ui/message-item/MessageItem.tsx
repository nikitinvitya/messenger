'use client'

import classNames from 'classnames';
import cls from './MessageItem.module.scss'
import {Box, Text} from "@mantine/core";
import {Message} from "@/entities/message";
import {useUserStore} from "@/entities/user";

interface MessageItemProps {
  className?: string;
  messageInfo: Message;
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
}

export const MessageItem = (props: MessageItemProps) => {
  const { messageInfo, isLastOfGroup, isFirstOfGroup } = props;

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

  const formatTime = (time: string) => new Date(time).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

  return (
    <div className={wrapperClass}>
      <Box className={bubbleClass}>
        <Text className={cls.messageContent}>{messageInfo.content}</Text>
        <Text className={cls.messageTime}>
          {formatTime(messageInfo.createdAt)}
        </Text>
      </Box>
    </div>
  );
};