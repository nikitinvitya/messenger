import classNames from 'classnames';
import cls from './ChatHeader.module.scss'
import Image from 'next/image'
import {ActionIcon, Box, Button, Menu, Text} from "@mantine/core";
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";
import {AppRoutes} from "@/shared/config/routes";
import ArrowIcon from '@/shared/assets/ArrowIcon.svg'
import {leaveChat} from "@/entities/chat/api/leaveChat";
import {useChatStore} from "@/entities/chat/model/store";
import {websocketService} from "@/shared/api/websocket";
import VerticalDotsIcon from "@/shared/assets/VerticalDotsIcon.svg"
import {router} from "next/client";
import {useRouter} from "next/navigation";

interface ChatHeaderProps {
  className?: string;
  chatName: string;
  chatID: number;
}

export const ChatHeader = ({chatName, chatID}: ChatHeaderProps) => {

  const removeChat = useChatStore((state) => state.removeChat)
  const router  = useRouter()

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

  return (
    <Box className={classNames(cls.chatHeader)}>
      <AppLink href={AppRoutes.chats}>
        <Button className={cls.toChatsBtn}>
          <Image
            src={ArrowIcon.src}
            alt={'to chats'}
            width={24}
            height={24}
          />
        </Button>
      </AppLink>

      <Text className={cls.chatName}>{chatName}</Text>

      <Box className={cls.menuWrapper}>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl">
              <Image
                src={VerticalDotsIcon.src}
                alt={"options"}
                width={24}
                height={24}
              />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              color="red"
              onClick={handleLeave}
            >
              Leave chat
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  );
};

