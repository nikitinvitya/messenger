import {api} from "@/shared/api";

export const createChat = async (userIDs: number[]): Promise<{ chatID: number }> => {
  const response = await api.post<{ chatID: number }>("/chats", {
    userIDs: userIDs,
    chatType: "private",
  })

  return response.data
}