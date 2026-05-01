import {api} from "@/shared/api";

export const forwardMessage = async (chatID: number, messageIDs: number[]) => {
  await api.post(`/messages/forward/${chatID}`, {messageIDs})
}