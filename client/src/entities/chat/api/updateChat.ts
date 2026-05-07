import { api } from "@/shared/api";
import { Chat } from "../model/model";

export const updateChat = async (chatID: number, data: { name?: string, avatarURL?: string }) => {
  const response = await api.put<Chat>(`/chats/${chatID}`, data);
  return response.data;
};