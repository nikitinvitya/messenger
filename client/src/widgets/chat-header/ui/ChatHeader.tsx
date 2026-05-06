'use client'

import { ActionIcon, Box, Menu, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import classNames from 'classnames';

import { Chat } from "@/entities/chat";
import { leaveChat } from "@/entities/chat/api/leaveChat";
import { useChatStore } from "@/entities/chat/model/store";
import { useUserStore } from "@/entities/user";
import { GroupInfo } from "@/widgets/group-info";
import { AppLink } from "@/shared/ui/AppLink/ui/AppLink";
import { AppRoutes } from "@/shared/config/routes";
import { websocketService } from "@/shared/api/websocket";
import { AppAvatar } from "@/shared/ui/AppAvatar/ui/AppAvatar";

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
  isOnline?: boolean;
}

export const ChatHeader = ({
                             chatName,
                             chatID,
                             chatType,
                             partnerAvatar,
                             partnerUsername,
                             isOnline: initialIsOnline
                           }: ChatHeaderProps) => {
  const router = useRouter();
  const removeChat = useChatStore((state) => state.removeChat);
  const [infoOpened, { open, close }] = useDisclosure(false);

  const { user: currentUser } = useUserStore();
  const currentChat = useChatStore((state) =>
    state.chats.find(c => c.id === chatID)
  );

  const partnerInStore = currentChat?.participants?.find(p => p.id !== currentUser?.id);

  const liveIsOnline = chatType === 'private'
    ? (partnerInStore?.isOnline ?? initialIsOnline)
    : false;

  const handleLeave = async () => {
    const confirmMsg = chatType === 'group'
      ? 'Вы действительно хотите покинуть группу?'
      : 'Вы уверены, что хотите удалить этот чат?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await leaveChat(chatID);
      removeChat(chatID);
      websocketService.disconnect();
      router.push(AppRoutes.chats);
    } catch (error) {
      console.error('Failed to leave chat:', error);
    }
  };

  const renderTitle = () => {
    const headerAvatar = (
      <AppAvatar
        src={partnerAvatar}
        name={chatName}
        isOnline={liveIsOnline}
        size={36}
      />
    );

    if (chatType === 'private' && partnerUsername) {
      return (
        <AppLink href={`${AppRoutes.profile}/${partnerUsername}`} className={cls.profileLink}>
          {headerAvatar}
          <Box className={cls.textInfo}>
            <Text className={cls.chatName}>{chatName}</Text>
            {liveIsOnline && <Text className={cls.statusText} c="blue">online</Text>}
          </Box>
        </AppLink>
      );
    }

    return (
      <Box onClick={open} className={cls.profileLink}>
        {headerAvatar}
        <Box className={cls.textInfo}>
          <Text className={cls.chatName}>{chatName}</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box className={classNames(cls.chatHeader)}>
      <Box className={cls.leftSection}>
        <AppLink href={AppRoutes.chats}>
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
            <Menu.Item color="red" onClick={handleLeave}>
              {chatType === 'group' ? 'Leave group' : 'Delete chat'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>

      {chatType === 'group' && (
        <GroupInfo chatID={chatID} opened={infoOpened} onClose={close} />
      )}
    </Box>
  );
};