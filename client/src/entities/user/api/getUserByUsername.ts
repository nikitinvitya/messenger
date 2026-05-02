import { api } from "@/shared/api";
import { User } from "../model/model";
import { cookies } from "next/headers";
import { JWT_TOKEN_KEY } from "@/shared/constants/cookie";

export const getUserByUsername = async (username: string): Promise<User> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_TOKEN_KEY);

  if (!token) {
    throw new Error('Unauthorized: No token provided');
  }

  const response = await api.get<User>(`/users/info/${username}`, {
    headers: {
      Cookie: `${token.name}=${token.value}`,
    },
  });

  return response.data;
};