import { api } from '@/shared/api';
import { cookies } from 'next/headers';
import { JWT_TOKEN_KEY } from '@/shared/constants/cookie';
import {MessageApiResponse} from "@/entities/message";

export const getMessages = async (chatID: number, page: number = 1): Promise<MessageApiResponse> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_TOKEN_KEY);

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await api.get(`/chats/${chatID}/messages`, {
    params: { page, pageSize: 50 },
    headers: {
      Cookie: `${token.name}=${token.value}`,
    },
  });

  return response.data;
};