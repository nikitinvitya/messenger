import { api } from '@/shared/api';
import { User } from '@/entities/user';
import { getServerApiBaseUrl, getServerApiCookieHeader } from '@/shared/lib/server-api-base';

export const getCurrentUser = async (): Promise<User> => {
  const cookieHeader = await getServerApiCookieHeader();
  if (!cookieHeader) throw new Error('Not authenticated');

  const response = await api.get<User>(`/users/me`, {
    baseURL: await getServerApiBaseUrl(),
    headers: {
      Cookie: cookieHeader,
    },
  });

  return response.data;
};
