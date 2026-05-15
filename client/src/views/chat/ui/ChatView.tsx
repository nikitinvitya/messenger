import { getMessages } from '@/entities/message/api/getMessages';
import { getChatById } from '@/entities/chat/api/getChatById';
import { getCurrentUser } from '@/entities/user/api/getCurrentUser';
import { Box } from '@mantine/core';
import { ChatWindow } from "@/widgets/chat-window";
import { ForwardModal } from "@/features/forward-modal";
import { redirect } from 'next/navigation';
import { AppRoutes } from "@/shared/config/routes";
import axios from 'axios';

interface ChatViewProps {
  chatID: number;
}

export async function ChatView({ chatID }: ChatViewProps) {
  try {
    const [messagesData, chat, currentUser] = await Promise.all([
      getMessages(chatID),
      getChatById(chatID),
      getCurrentUser(),
    ]);

    let chatName = 'Chat';
    let partnerAvatar = undefined;
    let partnerUsername = undefined;
    let partnerUserID: number | undefined;
    let partnerIsOnline = false;

    if (chat.type === 'group' && chat.name) {
      chatName = chat.name;
    } else if (chat.type === 'private') {
      const partner = chat.participants.find(p => p.id !== currentUser.id);
      if (partner) {
        chatName = partner.username;
        partnerAvatar = partner.avatarURL;
        partnerUsername = partner.username;
        partnerUserID = partner.id;
        partnerIsOnline = !!partner.isOnline;
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
          chatType={chat.type}
          partnerUsername={partnerUsername}
          partnerUserID={partnerUserID}
          partnerAvatar={partnerAvatar}
          initialIsOnline={partnerIsOnline}
          initialParticipantsCount={chat.participants.length}
          initialGroupAvatar={chat.avatarURL}
        />
        <ForwardModal />
      </Box>
    );

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        redirect(AppRoutes.chats);
      }
    }
    redirect(AppRoutes.chats);
  }
}