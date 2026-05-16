import { cache } from 'react';
import { Chat, ChatApiResponse } from '@/entities/chat';
import { api } from '@/shared/api';
import { redirect } from 'next/navigation';
import { AppRoutes } from '@/shared/config/routes';
import { getServerApiBaseUrl, getServerApiCookieHeader } from '@/shared/lib/server-api-base';

export const getChats = cache(async (): Promise<Chat[]> => {
  const cookieHeader = await getServerApiCookieHeader();
  if (!cookieHeader) {
    redirect(AppRoutes.login);
  }

  const response = await api.get<ChatApiResponse>(`/chats`, {
    baseURL: await getServerApiBaseUrl(),
    headers: {
      Cookie: cookieHeader,
    },
  });

  return response.data.chats;
});
