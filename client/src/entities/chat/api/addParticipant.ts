import { api } from "@/shared/api";

export const addParticipant = async (chatID: number, userID: number) => {
  return await api.post(`/chats/${chatID}/participants`, { userID });
};