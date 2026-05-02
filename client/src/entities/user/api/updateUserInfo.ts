import {api} from "@/shared/api";

interface updateUserInfoPayload {
  username: string;
  bio?: string;
  avatarURL?: string;
}

export const updateUserInfo = async (payload: updateUserInfoPayload) => {
  const response = await api.put(`/users/me`, payload);
  return response.data;
}