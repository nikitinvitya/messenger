'use client'

import classNames from 'classnames';
import cls from './ChatListHeader.module.scss'
import {Avatar, Box, Button} from "@mantine/core";
import {SearchUser} from "@/features/search-user";
import ArrowIcon from '@/shared/assets/ArrowIcon.svg'
import Image from "next/image"
import {getAvatarColor} from "@/shared/lib/getAvatarColor";
import { BACKEND_ORIGIN } from '@/shared/constants/api';
import {useUserStore} from "@/entities/user";
import {AppRoutes} from "@/shared/config/routes";
import {AppLink} from "@/shared/ui/AppLink/ui/AppLink";

interface ChatListHeaderProps {
  isActiveSearch: boolean;
  setIsActiveSearch: (state: boolean) => void;
  setSearchResults: (results: any[]) => void;
  className?: string;
}

export const ChatListHeader = ({isActiveSearch, setIsActiveSearch, setSearchResults}: ChatListHeaderProps) => {
  const { user } = useUserStore();
  const mediaOrigin = BACKEND_ORIGIN;
  const firstLetter = user?.username?.charAt(0).toUpperCase() || '?';
  const avatarColor = getAvatarColor(user?.username || '');

  return (
    <Box className={classNames(cls.chatListHeader)}>
      <Box className={cls.leftSection}>
        {isActiveSearch ? (
          <Button className={cls.headerButton} onClick={() => setIsActiveSearch(false)}>
            <Image
              src={ArrowIcon.src}
              fill
              alt={"exit"}
              className={cls.arrowImage}
            />
          </Button>
        ) : (
          <AppLink
            href={`${AppRoutes.profile}/${user?.username}`}
            className={cls.avatarLink}
          >
            <Avatar
              src={user?.avatarURL && mediaOrigin ? `${mediaOrigin}${user.avatarURL}` : null}
              radius="xl"
              size="md"
              styles={{
                root: { backgroundColor: avatarColor },
                placeholder: { color: '#fff', fontWeight: 600 }
              }}
            >
              {firstLetter}
            </Avatar>
          </AppLink>
        )}
      </Box>

      <SearchUser
        isActiveSearch={isActiveSearch}
        setIsActiveSearch={setIsActiveSearch}
        onSearchUpdate={setSearchResults}/>
    </Box>
  );
};