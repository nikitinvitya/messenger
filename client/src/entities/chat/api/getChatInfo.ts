import {api} from "@/shared/api";
import {Chat} from "@/entities/chat";

export const getChatInfo = async (chatID: number): Promise<Chat> => {
  const response = await api.get<Chat>(`/chats/${chatID}/info`);
  return response.data;
};