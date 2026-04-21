import {api} from "@/shared/api";
import {Chat} from "@/entities/chat";

interface CreateChatPayload {
  userIDs: number[];
  chatType: Chat["type"];
  name?: string;
}

export const createChat = async (payload: CreateChatPayload): Promise<{ chatID: number }> => {
  const response = await api.post<{ chatID: number }>("/chats", payload)

  return response.data
}