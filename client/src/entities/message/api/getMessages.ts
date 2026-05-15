import { api } from '@/shared/api';
import { MessageApiResponse } from '@/entities/message';
import { getServerApiBaseUrl, getServerApiCookieHeader } from '@/shared/lib/server-api-base';

export const getMessages = async (chatID: number, page: number = 1): Promise<MessageApiResponse> => {
  const cookieHeader = await getServerApiCookieHeader();
  if (!cookieHeader) {
    throw new Error('Not authenticated');
  }

  const response = await api.get(`/chats/${chatID}/messages`, {
    baseURL: await getServerApiBaseUrl(),
    params: { page, pageSize: 50 },
    headers: {
      Cookie: cookieHeader,
    },
  });

  const data = response.data ?? {};
  const messages = Array.isArray(data.messages) ? data.messages : [];
  const blockStatus = data.blockStatus ?? 'none';
  return { messages, blockStatus } as MessageApiResponse;
};
