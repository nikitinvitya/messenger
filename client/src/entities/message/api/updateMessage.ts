import {api} from "@/shared/api";

export const updateMessage = async (messageID: number, content: string) => {
  const response = await api.put(`/messages/${messageID}`, {content})
  return response.data
}