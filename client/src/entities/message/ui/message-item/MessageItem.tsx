'use client'

import classNames from 'classnames';
import cls from './MessageItem.module.scss'
import {Box, Text, Modal} from "@mantine/core";
import {Message} from "@/entities/message";
import {useUserStore} from "@/entities/user";
import {Chat} from "@/entities/chat";
import {BASE_URL} from "@/shared/constants/api";
import { Image as MantineImage } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';

interface MessageItemProps {
  className?: string;
  messageInfo: Message;
  chatType: Chat["type"];
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
}

export const MessageItem = (props: MessageItemProps) => {
  const { messageInfo, isLastOfGroup, isFirstOfGroup, chatType } = props;
  const [opened, { open, close }] = useDisclosure(false);

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
  const SERVER_URL = BASE_URL!.replace('/api/v1', '');
  const fullImageUrl = `${SERVER_URL}${messageInfo.imageURL}`;

  return (
    <div className={wrapperClass}>
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        centered
        withCloseButton={false}
        classNames={{
          content: cls.modalContent,
          body: cls.modalBody,
          overlay: cls.modalOverlay,
        }}
      >
        <img src={fullImageUrl} alt="Full view" className={cls.fullImage} onClick={close} />
      </Modal>

      <Box className={bubbleClass}>
        {isVisibleUsername && (
          <Text className={cls.usernameInside}>{messageInfo.sender.username}</Text>
        )}

        {messageInfo.imageURL && (
          <Box className={cls.imageWrapper} onClick={open}>
            <MantineImage
              src={fullImageUrl}
              alt="Attachment"
              className={cls.attachedImage}
            />
          </Box>
        )}

        <Box className={cls.contentAndTime}>
          {messageInfo.content && (
            <Text className={cls.messageContent}>{messageInfo.content}</Text>
          )}
          <Text className={cls.messageTime}>
            {formatTime(messageInfo.createdAt)}
          </Text>
        </Box>
      </Box>
    </div>
  );
};