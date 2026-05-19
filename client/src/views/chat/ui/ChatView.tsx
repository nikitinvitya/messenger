import { getMessages } from '@/entities/message/api/getMessages';
import { getChatById } from '@/entities/chat/api/getChatById';
import { getCurrentUser } from '@/entities/user/api/getCurrentUser';
import { getChatDisplayName, isSavedChat } from '@/entities/chat/lib/savedChat';
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

    const saved = isSavedChat(chat);
    let chatName = getChatDisplayName(chat, currentUser.id);
    let partnerAvatar: string | undefined;
    let partnerUsername: string | undefined;
    let partnerUserID: number | undefined;
    let partnerIsOnline = false;

    if (!saved && chat.type === 'private') {
      const partner = chat.participants.find(p => p.id !== currentUser.id);
      if (partner) {
        partnerAvatar = partner.avatarURL;
        partnerUsername = partner.username;
        partnerUserID = partner.id;
        partnerIsOnline = !!partner.isOnline;
      }
    }

    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatWindow
          initialMessages={messagesData.messages}
          blockStatus={saved ? 'none' : messagesData.blockStatus}
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
