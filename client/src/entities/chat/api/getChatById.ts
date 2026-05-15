import { api } from '@/shared/api';
import { Chat } from '@/entities/chat';
import { getServerApiBaseUrl, getServerApiCookieHeader } from '@/shared/lib/server-api-base';

export const getChatById = async (chatID: number): Promise<Chat> => {
  const cookieHeader = await getServerApiCookieHeader();
  if (!cookieHeader) throw new Error('Not authenticated');

  const response = await api.get(`/chats/${chatID}`, {
    baseURL: await getServerApiBaseUrl(),
    headers: {
      Cookie: cookieHeader,
    },
  });

  return response.data;
};
