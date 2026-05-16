'use client'

import { useMemo } from 'react';
import classNames from 'classnames';
import cls from './MessageItem.module.scss'
import {Box, Text, Modal, ActionIcon, Group, Menu} from "@mantine/core";
import {Message} from "@/entities/message";
import {useUserStore} from "@/entities/user";
import {Chat} from "@/entities/chat";
import {useChatStore} from "@/entities/chat/model/store";
import { BACKEND_ORIGIN } from '@/shared/constants/api';
import {Image as MantineImage} from "@mantine/core";
import {useDisclosure, useMediaQuery} from '@mantine/hooks';
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
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {messages, setEditingMessage, setReplyingToMessage, setForwardingMessage} = useMessageStore();
  const currentUser = useUserStore((state) => state.user);
  const isCurrentUserMessage = currentUser?.id === messageInfo.sender.id;

  const chat = useChatStore((state) =>
    state.chats.find(c => c.id === messageInfo.chatId)
  );

  const isRead = useMemo(() => {
    if (!isCurrentUserMessage || !chat || !chat.participants) return false;

    return chat.participants
      .filter(p => p.id !== currentUser?.id)
      .some(p => (p.lastReadMessageID || 0) >= messageInfo.id);
  }, [chat, messageInfo.id, isCurrentUserMessage, currentUser?.id]);

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
  const fullImageUrl =
    messageInfo.imageURL && BACKEND_ORIGIN
      ? `${BACKEND_ORIGIN}${messageInfo.imageURL}`
      : messageInfo.imageURL ?? '';

  const handleDelete = async () => {
    try {
      await deleteMessage(messageInfo.id);
    } catch {
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

  const messageContent = (
    <Box className={bubbleClass}>
      {!isMobile && (
        <div className={cls.actionsOverlay}>
          <Group gap={6} wrap="nowrap">
            <ActionIcon onClick={() => setReplyingToMessage(messageInfo)} className={cls.actionBubble} variant="filled" radius="xl" size="lg">
              <Image src={ReplyIcon.src} width={16} height={16} alt="reply"/>
            </ActionIcon>
            <ActionIcon onClick={() => setForwardingMessage(messageInfo)} className={cls.actionBubble} variant="filled" radius="xl" size="lg">
              <Image src={ForwardIcon.src} width={16} height={16} alt="forward"/>
            </ActionIcon>
            {isCurrentUserMessage && (
              <>
                <ActionIcon onClick={() => setEditingMessage(messageInfo)} className={cls.actionBubble} variant="filled" radius="xl" size="lg">
                  <Image src={EditIcon.src} width={16} height={16} alt="edit"/>
                </ActionIcon>
                <ActionIcon onClick={handleDelete} className={cls.actionBubble} variant="filled" radius="xl" size="lg" color="red">
                  <Image src={DeleteIcon.src} width={16} height={16} alt="delete"/>
                </ActionIcon>
              </>
            )}
          </Group>
        </div>
      )}

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
        <Box className={cls.imageWrapper} onClick={(e) => { e.stopPropagation(); open(); }}>
          <MantineImage src={fullImageUrl} alt="Attachment" className={cls.attachedImage}/>
        </Box>
      )}

      <Box className={cls.contentAndTime}>
        {messageInfo.content && <Text className={cls.messageContent}>{messageInfo.content}</Text>}
        <Box className={cls.statusWrapper}>
          <Text className={cls.messageTime}>{formatTime(messageInfo.createdAt)}</Text>
          {isCurrentUserMessage && (
            <div className={classNames(cls.ticks, { [cls.read]: isRead })}>
              {isRead ? '✓✓' : '✓'}
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <div className={wrapperClass} id={`message-${messageInfo.id}`}>
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        centered
        withCloseButton={false}
        classNames={{ content: cls.modalContent, body: cls.modalBody, overlay: cls.modalOverlay }}
      >
        <img src={fullImageUrl} alt="Full view" className={cls.fullImage} onClick={close}/>
      </Modal>

      {showAvatarGutter && (
        <Box className={cls.avatarGutter}>
          {isVisibleAvatar && (
            <Link
              href={`/profile/${messageInfo.sender.username}`}
              className={cls.avatarProfileLink}
            >
              <AppAvatar
                name={messageInfo.sender.username}
                src={messageInfo.sender.avatarURL}
                size={36}
              />
            </Link>
          )}
        </Box>
      )}

      {isMobile ? (
        <Menu
          shadow="md"
          width={200}
          position="bottom"
          offset={2}
          withinPortal={true}
        >
          <Menu.Target>
            {messageContent}
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setReplyingToMessage(messageInfo)} leftSection={<Image src={ReplyIcon.src} width={14} height={14} alt="" />}>
              Reply
            </Menu.Item>
            <Menu.Item onClick={() => setForwardingMessage(messageInfo)} leftSection={<Image src={ForwardIcon.src} width={14} height={14} alt="" />}>
              Forward
            </Menu.Item>
            {isCurrentUserMessage && (
              <>
                <Menu.Item onClick={() => setEditingMessage(messageInfo)} leftSection={<Image src={EditIcon.src} width={14} height={14} alt="" />}>
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  onClick={handleDelete}
                  leftSection={<Image src={DeleteIcon.src} width={14} height={14} alt="" style={{filter: 'invert(30%) sepia(90%) saturate(3000%) hue-rotate(340deg)'}}/>}
                >
                  Delete
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      ) : (
        messageContent
      )}
    </div>
  );
};