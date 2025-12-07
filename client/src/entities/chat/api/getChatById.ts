import { cookies } from 'next/headers';
import { api } from '@/shared/api';
import { JWT_TOKEN_KEY } from '@/shared/constants/cookie';
import {Chat} from "@/entities/chat";

export const getChatById = async (chatID: string): Promise<Chat> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_TOKEN_KEY);
  if (!token) throw new Error('Not authenticated');

  const response = await api.get(`/chats/${chatID}`, {
    headers: {
      Cookie: `${token.name}=${token.value}`,
    },
  });


  return response.data;
};