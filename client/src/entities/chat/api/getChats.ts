import {Chat, ChatApiResponse} from "@/entities/chat";
import {api} from "@/shared/api";
import {cookies} from "next/headers";
import {JWT_TOKEN_KEY} from "@/shared/constants/cookie";
import {mapChatsResponse} from "@/entities/chat/api/mapper";

export const getChats = async (): Promise<Chat[]> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_TOKEN_KEY)
  if(!token) {
    throw new Error('Not authenticated')
  }

  const response = await api.get<ChatApiResponse>(`/chats`, {
    headers: {
      Cookie: `${token.name}=${token.value}`
    }
  })
  return mapChatsResponse(response.data)
}