import { cookies } from 'next/headers';
import { api } from '@/shared/api';
import { JWT_TOKEN_KEY } from '@/shared/constants/cookie';
import {User} from "@/entities/user";

export const getCurrentUser = async (): Promise<User> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_TOKEN_KEY);
  if (!token) throw new Error('Not authenticated');

  const response = await api.get<User>(`/users/me`, {
    headers: {
      Cookie: `${token.name}=${token.value}`,
    },
  });

  return response.data;
};