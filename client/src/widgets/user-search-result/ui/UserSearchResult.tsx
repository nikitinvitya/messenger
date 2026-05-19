'use client'

import cls from './UserSearchResult.module.scss'
import {UserSearchResponse} from "@/entities/user/model/model";
import {Box, Text} from "@mantine/core";
import {createChat} from "@/entities/chat/api/createChat";
import {getChatInfo} from "@/entities/chat/api/getChatInfo";
import {useChatStore} from "@/entities/chat/model/store";
import {useRouter} from "next/navigation";
import {AppRoutes} from "@/shared/config/routes";
import {AppAvatar} from "@/shared/ui/AppAvatar/ui/AppAvatar";

interface UserSearchResultProps {
  className?: string;
  users: UserSearchResponse[];
}

export const UserSearchResult = ({ users }: UserSearchResultProps) => {
  const router = useRouter();

  const handleUserSelect = async (e: React.MouseEvent, user: UserSearchResponse) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await createChat({
        userIDs: [user.id],
        chatType: "private",
      });
      try {
        const chat = await getChatInfo(res.chatID);
        useChatStore.getState().addChat(chat);
      } catch {
      }
      router.push(`${AppRoutes.chats}/${res.chatID}`);
    } catch (e: unknown) {
      const err = e as { code?: string; name?: string };
      if (err.code === 'ECONNABORTED' || err.name === 'CanceledError') return;
    }
  };

  return (
    <Box className={cls.userSearchResult}>
      {users.length !== 0 ? (
        users.map(user => (
          <Box
            key={user.id}
            onClick={(e) => handleUserSelect(e, user)}
            className={cls.userSearchResultItem}
          >
            <AppAvatar
              src={user.avatarURL}
              name={user.username}
              isOnline={user.isOnline}
              size={40}
            />
            <Text>{user.username}</Text>
          </Box>
        ))
      ) : (
        <Text className={cls.notFound}>Not found users</Text>
      )}
    </Box>
  );
};