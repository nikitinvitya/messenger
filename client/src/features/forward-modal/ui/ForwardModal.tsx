'use client'

import { Modal, ScrollArea, Text, UnstyledButton, Group, Box } from '@mantine/core';
import { useMemo } from 'react';
import { useChatStore } from '@/entities/chat/model/store';
import { useMessageStore } from '@/entities/message/model/store';
import { forwardMessage } from '@/entities/message/api/forwardMessage';
import { useUserStore } from '@/entities/user';
import { getChatDisplayName, isSavedChat } from '@/entities/chat/lib/savedChat';
import { AppAvatar } from '@/shared/ui/AppAvatar/ui/AppAvatar';
import { SavedMessagesAvatar } from '@/shared/ui/SavedMessagesAvatar/ui/SavedMessagesAvatar';
import cls from './ForwardModal.module.scss';

export const ForwardModal = () => {
  const { chats } = useChatStore();
  const { forwardingMessage, setForwardingMessage } = useMessageStore();
  const currentUser = useUserStore(state => state.user);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (isSavedChat(a) && !isSavedChat(b)) return -1;
      if (isSavedChat(b) && !isSavedChat(a)) return 1;
      return 0;
    });
  }, [chats]);

  const handleForward = async (targetChatId: number) => {
    if (!forwardingMessage) return;
    try {
      await forwardMessage(targetChatId, [forwardingMessage.id]);
      setForwardingMessage(null);
    } catch {
    }
  };

  const getChatAvatar = (chat: (typeof chats)[number]) => {
    if (isSavedChat(chat)) {
      return <SavedMessagesAvatar size={40} />;
    }

    if (chat.type === 'group') {
      return (
        <AppAvatar
          src={chat.avatarURL}
          name={chat.name || 'Group'}
          size={40}
        />
      );
    }

    const partner = chat.participants?.find((p) => p.id !== currentUser?.id);
    return (
      <AppAvatar
        src={partner?.avatarURL}
        name={partner?.username || 'User'}
        isOnline={!!partner?.isOnline}
        size={40}
      />
    );
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
          {sortedChats.map(chat => {
            const name = getChatDisplayName(chat, currentUser?.id);
            return (
              <UnstyledButton
                key={chat.id}
                className={cls.chatOption}
                onClick={() => handleForward(chat.id)}
              >
                <Group gap="sm" wrap="nowrap">
                  {getChatAvatar(chat)}
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
