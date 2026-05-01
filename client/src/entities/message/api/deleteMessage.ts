import {api} from "@/shared/api";

export const deleteMessage = async (messageID: number) => {
  await api.delete(`/messages/${messageID}`)
}