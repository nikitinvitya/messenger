import classNames from 'classnames';
import cls from './ChatHeader.module.scss'
import Image from 'next/image'
import {Box, Button, Text} from "@mantine/core";
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";
import {AppRoutes} from "@/shared/config/routes";
import ArrowIcon from '@/shared/assets/ArrowIcon.svg'

interface ChatHeaderProps {
  className?: string;
  chatName: string;
}

export const ChatHeader = ({chatName}: ChatHeaderProps) => {
  return (
    <Box className={classNames(cls.chatHeader)}>
      <AppLink href={AppRoutes.chats}>
        <Button className={cls.toChatsBtn}>
          <Image src={ArrowIcon.src} alt='to chats' fill/>
        </Button>
      </AppLink>
      <Text className={cls.chatName}>{chatName}</Text>
      <Box>

      </Box>
    </Box>
  );
};

