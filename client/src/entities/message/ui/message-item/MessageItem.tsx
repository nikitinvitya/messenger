'use client'

import classNames from 'classnames';
import cls from './MessageItem.module.scss'
import {Box, Text, Modal, ActionIcon, Group} from "@mantine/core";
import {Message} from "@/entities/message";
import {useUserStore} from "@/entities/user";
import {Chat} from "@/entities/chat";
import {BASE_URL} from "@/shared/constants/api";
import {Image as MantineImage} from "@mantine/core";
import {useDisclosure} from '@mantine/hooks';
import {useMessageStore} from "../../model/store";
import {deleteMessage} from "../../api/deleteMessage";
import {AppAvatar} from "@/shared/ui/AppAvatar/ui/AppAvatar";

import ReplyIcon from "@/shared/assets/ReplyIcon.svg";
import ForwardIcon from "@/shared/assets/ForwardIcon.svg";
import EditIcon from "@/shared/assets/EditIcon.svg";
import DeleteIcon from "@/shared/assets/DeleteIcon.svg";
import Image from "next/image";
import Link from "next/link";

interface MessageItemProps {
  className?: string;
  messageInfo: Message;
  chatType: Chat["type"];
  isFirstOfGroup: boolean;
  isLastOfGroup: boolean;
}

export const MessageItem = (props: MessageItemProps) => {
  const {messageInfo, isLastOfGroup, isFirstOfGroup, chatType} = props;
  const [opened, {open, close}] = useDisclosure(false);

  const {messages, setEditingMessage, setReplyingToMessage, setForwardingMessage} = useMessageStore();
  const currentUser = useUserStore((state) => state.user);
  const isCurrentUserMessage = currentUser?.id === messageInfo.sender.id;

  if (messageInfo.type === 'system') {
    return (
      <Box className={cls.systemMessageWrapper}>
        <Text className={cls.systemMessageText}>
          <Link href={`/profile/${messageInfo.sender.username}`} className={cls.systemLink}>
            {messageInfo.sender.username}
          </Link> {messageInfo.content}
        </Text>
      </Box>
    );
  }

  const repliedMessage = messageInfo.replyToMessageId
    ? messages.find(m => m.id === messageInfo.replyToMessageId)
    : null;

  const wrapperClass = classNames(cls.messageWrapper, {
    [cls.myMessageWrapper]: isCurrentUserMessage,
    [cls.theirMessageWrapper]: !isCurrentUserMessage,
  });

  const bubbleClass = classNames(cls.messageItem, {
    [cls.fromMe]: isCurrentUserMessage,
    [cls.fromThem]: !isCurrentUserMessage,
    [cls.tail]: isLastOfGroup,
    [cls.first]: isFirstOfGroup,
  });

  const isVisibleUsername = isFirstOfGroup && !isCurrentUserMessage && chatType === "group";
  const showAvatarGutter = chatType === "group" && !isCurrentUserMessage;
  const isVisibleAvatar = isLastOfGroup && showAvatarGutter;

  const formatTime = (time: string) => new Date(time).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
  const SERVER_URL = BASE_URL!.replace('/api/v1', '');
  const fullImageUrl = `${SERVER_URL}${messageInfo.imageURL}`;

  const handleDelete = async () => {
    try {
      await deleteMessage(messageInfo.id);
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToOriginal = () => {
    if (!messageInfo.replyToMessageId) return;
    const element = document.getElementById(`message-${messageInfo.replyToMessageId}`);
    if (element) {
      element.scrollIntoView({behavior: 'smooth', block: 'center'});
      element.classList.add(cls.highlighted);
      setTimeout(() => {
        element.classList.remove(cls.highlighted);
      }, 1500);
    }
  };

  return (
    <div className={wrapperClass} id={`message-${messageInfo.id}`}>
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
        <img src={fullImageUrl} alt="Full view" className={cls.fullImage} onClick={close}/>
      </Modal>

      {showAvatarGutter && (
        <Box className={cls.avatarGutter}>
          {isVisibleAvatar && (
            <Link href={`/profile/${messageInfo.sender.username}`}>
              <AppAvatar
                name={messageInfo.sender.username}
                src={messageInfo.sender.avatarURL}
                size={36}
              />
            </Link>

          )}
        </Box>
      )}

      <Box className={bubbleClass}>
        <div className={cls.actionsOverlay}>
          <Group gap={6} wrap="nowrap">
            <ActionIcon onClick={() => setReplyingToMessage(messageInfo)} className={cls.actionBubble} variant="filled"
                        radius="xl" size="lg">
              <Image src={ReplyIcon.src} width={16} height={16} alt="reply"/>
            </ActionIcon>
            <ActionIcon onClick={() => setForwardingMessage(messageInfo)} className={cls.actionBubble} variant="filled"
                        radius="xl" size="lg">
              <Image src={ForwardIcon.src} width={16} height={16} alt="forward"/>
            </ActionIcon>
            {isCurrentUserMessage && (
              <>
                <ActionIcon onClick={() => setEditingMessage(messageInfo)} className={cls.actionBubble} variant="filled"
                            radius="xl" size="lg">
                  <Image src={EditIcon.src} width={16} height={16} alt="edit"/>
                </ActionIcon>
                <ActionIcon onClick={handleDelete} className={cls.actionBubble} variant="filled" radius="xl" size="lg"
                            color="red">
                  <Image src={DeleteIcon.src} width={16} height={16} alt="delete"/>
                </ActionIcon>
              </>
            )}
          </Group>
        </div>

        {isVisibleUsername && (
          <Link href={`/profile/${messageInfo.sender.username}`} className={cls.usernameInside}>
            {messageInfo.sender.username}
          </Link>
        )}

        {repliedMessage && (
          <Box className={cls.replyQuote} onClick={scrollToOriginal}>
            <div className={cls.accentBar}/>
            <div className={cls.replyInfo}>
              <Text className={cls.replySender}>{repliedMessage.sender.username}</Text>
              <Text className={cls.replyContent} truncate="end">
                {repliedMessage.imageURL ? '📷 Photo' : repliedMessage.content}
              </Text>
            </div>
          </Box>
        )}

        {messageInfo.forwardedFromUserId && (
          <Text className={cls.forwardedLabel}>Forwarded message</Text>
        )}

        {messageInfo.imageURL && (
          <Box className={cls.imageWrapper} onClick={open}>
            <MantineImage src={fullImageUrl} alt="Attachment" className={cls.attachedImage}/>
          </Box>
        )}

        <Box className={cls.contentAndTime}>
          {messageInfo.content && <Text className={cls.messageContent}>{messageInfo.content}</Text>}
          <Text className={cls.messageTime}>{formatTime(messageInfo.createdAt)}</Text>
        </Box>
      </Box>
    </div>
  );
};