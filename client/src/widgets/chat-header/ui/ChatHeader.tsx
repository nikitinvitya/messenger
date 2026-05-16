'use client'

import { ActionIcon, Box, Menu, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import classNames from 'classnames';

import { Chat } from "@/entities/chat";
import { leaveChat } from "@/entities/chat/api/leaveChat";
import { clearChatHistory } from "@/entities/chat/api/clearChatHistory";
import { getChatDisplayName, isSavedChat } from "@/entities/chat/lib/savedChat";
import { useChatStore } from "@/entities/chat/model/store";
import { useUserStore } from "@/entities/user";
import { blockUser, unblockUser } from "@/entities/blocklist";
import { useMessageStore } from "@/entities/message";
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { AppRoutes } from "@/shared/config/routes";
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";
import { SavedMessagesAvatar } from "@/shared/ui/SavedMessagesAvatar/ui/SavedMessagesAvatar";

import ArrowIcon from '@/shared/assets/ArrowIcon.svg';
import VerticalDotsIcon from "@/shared/assets/VerticalDotsIcon.svg";
import cls from './ChatHeader.module.scss';

interface ChatHeaderProps {
  className?: string;
  chatName: string;
  chatID: number;
  chatType: Chat["type"];
  partnerAvatar?: string;
  partnerUsername?: string;
  partnerUserID?: number;
  isOnline?: boolean;
  initialParticipantsCount?: number;
  initialGroupAvatar?: string;
  onToggleInfo: () => void;
}

export const ChatHeader = ({
  chatName: initialChatName,
  chatID,
  chatType,
  partnerAvatar: initialPartnerAvatar,
  partnerUsername,
  partnerUserID: partnerUserIDProp,
  isOnline: initialIsOnline,
  initialParticipantsCount,
  initialGroupAvatar,
  onToggleInfo
}: ChatHeaderProps) => {
  const router = useRouter();
  const removeChat = useChatStore((state) => state.removeChat);
  const updateChat = useChatStore((state) => state.updateChat);
  const blockStatus = useMessageStore((state) => state.blockStatus);
  const setBlockStatus = useMessageStore((state) => state.setBlockStatus);
  const clearMessages = useMessageStore((state) => state.clearMessages);

  const { user: currentUser } = useUserStore();

  const chatFromStore = useChatStore((state) =>
    state.chats.find(c => c.id === chatID)
  );

  const saved = isSavedChat({ type: chatType });
  const partnerInStore = chatFromStore?.participants?.find(p => p.id !== currentUser?.id);

  const displayChatName = chatFromStore
    ? getChatDisplayName(chatFromStore, currentUser?.id)
    : initialChatName;

  const displayAvatar = chatType === 'group'
    ? (chatFromStore?.avatarURL || initialGroupAvatar)
    : (partnerInStore?.avatarURL || initialPartnerAvatar);

  const liveIsOnline = chatType === 'private'
    ? (partnerInStore?.isOnline ?? initialIsOnline)
    : false;

  const participantsCount = chatFromStore?.participants
    ? chatFromStore.participants.length
    : (initialParticipantsCount ?? 0);

  const partnerUserID =
    partnerUserIDProp ??
    partnerInStore?.id ??
    chatFromStore?.participants?.find((p) => p.id !== currentUser?.id)?.id;

  const handleLeave = async () => {
    try {
      await leaveChat(chatID);
      removeChat(chatID);
      router.push(AppRoutes.chats);
    } catch {
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearChatHistory(chatID);
      clearMessages();
      updateChat(chatID, { lastMessage: undefined, unreadCount: 0 });
    } catch {
    }
  };

  const handleBlock = async () => {
    if (!partnerUserID) return;
    try {
      await blockUser(partnerUserID);
      setBlockStatus('recipient_blocked');
    } catch {
    }
  };

  const handleUnblockFromMenu = async () => {
    if (!partnerUserID) return;
    try {
      await unblockUser(partnerUserID);
      setBlockStatus('none');
    } catch {
    }
  };

  const renderTitle = () => {
    const headerAvatar = saved ? (
      <SavedMessagesAvatar size={36} />
    ) : (
      <AppAvatar
        src={displayAvatar}
        name={displayChatName}
        isOnline={liveIsOnline}
        size={36}
      />
    );

    if (saved) {
      return (
        <Box className={cls.profileLink}>
          {headerAvatar}
          <Box className={cls.textInfo}>
            <Text className={cls.chatName}>{displayChatName}</Text>
          </Box>
        </Box>
      );
    }

    if (chatType === 'private' && partnerUsername) {
      return (
        <AppLink href={`${AppRoutes.profile}/${partnerUsername}`} className={cls.profileLink}>
          {headerAvatar}
          <Box className={cls.textInfo}>
            <Text className={cls.chatName}>{displayChatName}</Text>
            {liveIsOnline && <Text className={cls.statusOnline}>online</Text>}
          </Box>
        </AppLink>
      );
    }

    return (
      <Box onClick={onToggleInfo} className={cls.profileLink}>
        {headerAvatar}
        <Box className={cls.textInfo}>
          <Text className={cls.chatName}>{displayChatName}</Text>
          <Text className={cls.statusMuted}>
            {participantsCount} participants
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box className={classNames(cls.chatHeader)}>
      <Box className={cls.leftSection}>
        <AppLink href={AppRoutes.chats} className={cls.backButton}>
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
            <Image src={ArrowIcon.src} alt="back" width={24} height={24} />
          </ActionIcon>
        </AppLink>
      </Box>

      <Box className={cls.centerSection}>
        {renderTitle()}
      </Box>

      <Box className={cls.rightSection}>
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
              <Image src={VerticalDotsIcon.src} alt="options" width={24} height={24} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            {saved ? (
              <Menu.Item onClick={handleClearHistory}>Clear history</Menu.Item>
            ) : (
              <>
                {chatType === 'private' && partnerUserID && (
                  <>
                    {blockStatus === 'recipient_blocked' ? (
                      <Menu.Item onClick={handleUnblockFromMenu}>Unblock user</Menu.Item>
                    ) : (
                      <Menu.Item onClick={handleBlock}>Block user</Menu.Item>
                    )}
                    <Menu.Divider />
                  </>
                )}
                <Menu.Item color="red" onClick={handleLeave}>
                  {chatType === 'group' ? 'Leave group' : 'Delete chat'}
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  );
};
