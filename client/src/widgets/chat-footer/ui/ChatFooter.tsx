'use client';

import { Box, Button, Text } from '@mantine/core';
import { useState } from 'react';
import { SendMessageForm } from '@/features/send-message';
import { unblockUser } from '@/entities/blocklist';
import { useMessageStore, type BlockStatus } from '@/entities/message';
import cls from './ChatFooter.module.scss';

interface ChatFooterProps {
  chatID: number;
  partnerUserID: number | undefined;
}

export const ChatFooter = ({ chatID, partnerUserID }: ChatFooterProps) => {
  const blockStatus = useMessageStore((state) => state.blockStatus);
  const setBlockStatus = useMessageStore((state) => state.setBlockStatus);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleUnblock = async () => {
    if (!partnerUserID) return;
    setIsUnblocking(true);
    try {
      await unblockUser(partnerUserID);
      setBlockStatus('none');
    } catch (error) {
      console.error('Failed to unblock user:', error);
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <Box className={cls.footer}>
      <FooterContent
        blockStatus={blockStatus}
        chatID={chatID}
        isUnblocking={isUnblocking}
        onUnblock={handleUnblock}
      />
    </Box>
  );
};

function FooterContent({
  blockStatus,
  chatID,
  isUnblocking,
  onUnblock,
}: {
  blockStatus: BlockStatus;
  chatID: number;
  isUnblocking: boolean;
  onUnblock: () => void;
}) {
  if (blockStatus === 'recipient_blocked') {
    return (
      <Box className={cls.blockedState}>
        <Text className={cls.blockedText}>You blocked this user</Text>
        <Button className={cls.unblockBtn} onClick={onUnblock} loading={isUnblocking}>
          Unblock
        </Button>
      </Box>
    );
  }

  if (blockStatus === 'sender_blocked') {
    return (
      <Box className={cls.blockedState}>
        <Text className={cls.blockedText}>You can&apos;t send messages — you are blocked</Text>
      </Box>
    );
  }

  return <SendMessageForm chatID={chatID} />;
}
