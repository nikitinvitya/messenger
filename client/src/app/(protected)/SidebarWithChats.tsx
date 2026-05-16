import { getChats } from '@/entities/chat/api/getChats';
import { Sidebar } from '@/widgets/sidebar';

export async function SidebarWithChats() {
  const chats = await getChats();

  return <Sidebar initialChats={chats} />;
}
