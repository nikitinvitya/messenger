import { getMessages } from '@/entities/message/api/getMessages';
import { getChatById } from '@/entities/chat/api/getChatById';
import { getCurrentUser } from '@/entities/user/api/getCurrentUser';
import { Box } from '@mantine/core';
import {ChatWindow} from "@/widgets/chat-window";

interface ChatViewProps {
  chatID: string;
}

export async function ChatView({ chatID }: ChatViewProps) {
  const [messagesData, chat, currentUser] = await Promise.all([
    getMessages(chatID),
    getChatById(chatID),
    getCurrentUser(),
  ]);

  let chatName = 'Chat';
  if (chat.type === 'group' && chat.name) {
    chatName = chat.name;
  } else if (chat.type === 'private') {
    const partner = chat.participants.find(p => p.id !== currentUser.id);
    if (partner) {
      chatName = partner.username;
    } else {
      chatName = "Saved Messages";
    }
  }

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ChatWindow
        initialMessages={messagesData.messages}
        blockStatus={messagesData.blockStatus}
        chatID={chatID}
        chatName={chatName}
      />
    </Box>
  );
}