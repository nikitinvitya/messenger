import classNames from 'classnames';
import cls from './ChatHeader.module.scss'
import Image from 'next/image'
import {ActionIcon, Avatar, Box, Menu, Text} from "@mantine/core";
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";
import {AppRoutes} from "@/shared/config/routes";
import ArrowIcon from '@/shared/assets/ArrowIcon.svg'
import {leaveChat} from "@/entities/chat/api/leaveChat";
import {useChatStore} from "@/entities/chat/model/store";
import {websocketService} from "@/shared/api/websocket";
import VerticalDotsIcon from "@/shared/assets/VerticalDotsIcon.svg"
import {useRouter} from "next/navigation";
import {Chat} from "@/entities/chat";
import {BASE_URL} from "@/shared/constants/api";

interface ChatHeaderProps {
  className?: string;
  chatName: string;
  chatID: number;
  chatType: Chat["type"];
  partnerAvatar: string | undefined;
  partnerUsername: string | undefined;
}

export const ChatHeader = ({chatName, chatID, chatType, partnerAvatar, partnerUsername}: ChatHeaderProps) => {
  const removeChat = useChatStore((state) => state.removeChat)
  const router = useRouter()

  const SERVER_URL = BASE_URL!.replace('/api/v1', '');

  const handleLeave = async () => {
    try {
      await leaveChat(chatID);
      removeChat(chatID);
      websocketService.disconnect();
      router.push(AppRoutes.chats);
    } catch (error) {
      console.error('Failed to leave chat:', error);
    }
  }

  const renderTitle = () => {
    if (chatType === 'private' && partnerUsername) {
      return (
        <AppLink href={`${AppRoutes.profile}/${partnerUsername}`} className={cls.profileLink}>
          <Avatar
            src={partnerAvatar ? `${SERVER_URL}${partnerAvatar}` : null}
            radius="xl"
            size="sm"
          >
            {chatName.slice(0, 1).toUpperCase()}
          </Avatar>
          <Text className={cls.chatName}>{chatName}</Text>
        </AppLink>
      );
    }
    return <Text className={cls.chatName}>{chatName}</Text>;
  }

  return (
    <Box className={classNames(cls.chatHeader)}>
      <Box className={cls.leftSection}>
        <AppLink href={AppRoutes.chats}>
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
            <Image src={ArrowIcon.src} alt={'to chats'} width={24} height={24} />
          </ActionIcon>
        </AppLink>
      </Box>

      <Box className={cls.centerSection}>
        {renderTitle()}
      </Box>

      <Box className={cls.menuWrapper}>
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
              <Image src={VerticalDotsIcon.src} alt={"options"} width={24} height={24} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item color="red" onClick={handleLeave}>
              {chatType === 'group' ? 'Leave group' : 'Delete chat'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  );
};

