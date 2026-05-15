import { api } from '@/shared/api';
import { User } from '../model/model';
import { getServerApiBaseUrl, getServerApiCookieHeader } from '@/shared/lib/server-api-base';

export const getUserByUsername = async (username: string): Promise<User> => {
  const cookieHeader = await getServerApiCookieHeader();
  if (!cookieHeader) {
    throw new Error('Unauthorized: No token provided');
  }

  const response = await api.get<User>(`/users/info/${username}`, {
    baseURL: await getServerApiBaseUrl(),
    headers: {
      Cookie: cookieHeader,
    },
  });

  return response.data;
};
