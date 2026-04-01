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

export const UserSearchResult = ({users}: UserSearchResultProps) => {

  const router = useRouter()

  const handleUserSelect = async (user: UserSearchResponse) => {
    try {
        const res = await createChat([user.id])
        router.push(`${AppRoutes.chats}/${res.chatID}`)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Box className={cls.userSearchResult}>
      {
        users.length !== 0
        ? users.map(user => (
        <Box
          key={user.id}
          onClick={() => handleUserSelect(user)}
          className={cls.userSearchResultItem}
        >{user.username}</Box>
      ))
      :
      <Text className={cls.notFound}>Not found</Text>
      }
    </Box>
  );
};

