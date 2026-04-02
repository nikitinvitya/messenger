import {api} from "@/shared/api";

export const leaveChat =async (chatID: number) => {
  await api.delete(`/chats/leave/${chatID}`)
}