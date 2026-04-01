import {ChatsView} from "@/views/chats";
import {getChats} from "@/entities/chat/api/getChats";

export default async function Chats() {
  const chats = await getChats()

  return (
    <ChatsView chats={chats}/>
  )
}
