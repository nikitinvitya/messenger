'use client'

import cls from './UserSearchResult.module.scss'
import {UserSearchResponse} from "@/entities/user/model/model";
import {Box, Text} from "@mantine/core";
import {createChat} from "@/entities/chat/api/createChat";
import {useRouter} from "next/navigation";
import {AppRoutes} from "@/shared/config/routes";

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
      router.push(`${AppRoutes.chats}/${res.chatID}`);
    } catch (e: any) {
      if (e.code === 'ECONNABORTED' || e.name === 'CanceledError') return;
      console.log('Chat creation error:', e);
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
            {user.username}
          </Box>
        ))
      ) : (
        <Text className={cls.notFound}>Not found users</Text>
      )}
    </Box>
  );
};