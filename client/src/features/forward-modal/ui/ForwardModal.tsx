'use client'

import { Modal, ScrollArea, Text, UnstyledButton } from '@mantine/core';
import { useChatStore } from '@/entities/chat/model/store';
import { useMessageStore } from '@/entities/message/model/store';
import { forwardMessage } from '@/entities/message/api/forwardMessage';
import { useUserStore } from '@/entities/user';
import cls from './ForwardModal.module.scss';

export const ForwardModal = () => {
  const { chats } = useChatStore();
  const { forwardingMessage, setForwardingMessage } = useMessageStore();
  const currentUser = useUserStore(state => state.user);

  const handleForward = async (targetChatId: number) => {
    if (!forwardingMessage) return;
    try {
      await forwardMessage(targetChatId, [forwardingMessage.id]);
      setForwardingMessage(null);
    } catch (e) {
      console.error("Failed to forward message", e);
    }
  };

  const getChatName = (chat: any) => {
    if (chat.type === 'group') return chat.name;
    const partner = chat.participants?.find((p: any) => p.id !== currentUser?.id);
    return partner ? partner.username : "Saved Messages";
  };

  return (
    <Modal
      opened={!!forwardingMessage}
      onClose={() => setForwardingMessage(null)}
      title="Forward to..."
      radius="md"
    >
      <ScrollArea h={300}>
        {chats.map(chat => (
          <UnstyledButton
            key={chat.id}
            className={cls.chatOption}
            onClick={() => handleForward(chat.id)}
          >
            <Text fw={500}>{getChatName(chat)}</Text>
          </UnstyledButton>
        ))}
      </ScrollArea>
    </Modal>
  );
};