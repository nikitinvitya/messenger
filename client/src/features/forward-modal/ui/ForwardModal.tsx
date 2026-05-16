'use client'

import { Modal, ScrollArea, Text, UnstyledButton, Group, Box } from '@mantine/core';
import { useChatStore } from '@/entities/chat/model/store';
import { useMessageStore } from '@/entities/message/model/store';
import { forwardMessage } from '@/entities/message/api/forwardMessage';
import { useUserStore } from '@/entities/user';
import { AppAvatar } from '@/shared/ui/AppAvatar/ui/AppAvatar';
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
    } catch {
    }
  };

  const getChatData = (chat: any) => {
    if (chat.type === 'group') {
      return {
        name: chat.name || "Group",
        avatar: chat.avatarURL,
        isOnline: false
      };
    }

    const partner = chat.participants?.find((p: any) => p.id !== currentUser?.id);
    if (partner) {
      return {
        name: partner.username,
        avatar: partner.avatarURL,
        isOnline: partner.isOnline
      };
    }

    return {
      name: "Saved Messages",
      avatar: currentUser?.avatarURL,
      isOnline: false
    };
  };

  return (
    <Modal
      opened={!!forwardingMessage}
      onClose={() => setForwardingMessage(null)}
      title="Forward to..."
      radius="md"
      classNames={{
        content: cls.modalContent
      }}
    >
      <ScrollArea h={400} type="auto">
        <Box className={cls.list}>
          {chats.map(chat => {
            const { name, avatar, isOnline } = getChatData(chat);
            return (
              <UnstyledButton
                key={chat.id}
                className={cls.chatOption}
                onClick={() => handleForward(chat.id)}
              >
                <Group gap="sm" wrap="nowrap">
                  <AppAvatar
                    src={avatar}
                    name={name}
                    isOnline={isOnline}
                    size={40}
                  />
                  <Text fw={500} className={cls.chatName} truncate="end">
                    {name}
                  </Text>
                </Group>
              </UnstyledButton>
            );
          })}
        </Box>
      </ScrollArea>
    </Modal>
  );
};