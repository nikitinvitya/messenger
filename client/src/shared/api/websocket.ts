import { api } from './index';
import { useMessageStore } from '@/entities/message/model/store';
import { useChatStore } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import { WS_BASE_URL } from "@/shared/constants/api"

type EventType =
  | 'create_message'
  | 'update_message'
  | 'delete_message'
  | 'user_left_chat'
  | 'chat_created'
  | 'chat_deleted'
  | 'user_status'
  | 'chat_updated'
  | 'messages_read';

interface WebSocketEvent {
  type: EventType;
  payload: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;

  private async getTicket(): Promise<string> {
    const response = await api.get<{ ticket: string }>('/auth/ws-ticket');
    return response.data.ticket;
  }

  public async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
    try {
      const ticket = await this.getTicket();
      const url = `${WS_BASE_URL}/ws/connect?token=${ticket}`;
      this.socket = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to establish global WebSocket connection:', error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onmessage = (event) => {
      try {
        const parsedEvent: WebSocketEvent = JSON.parse(event.data);
        const { type, payload } = parsedEvent;
        const { addMessage, updateMessage, deleteMessage } = useMessageStore.getState();
        const { removeChat, addChat, updateChat, updateParticipantStatus } = useChatStore.getState();
        const { user: currentUser } = useUserStore.getState();

        const chatId = Number(payload.chatId || payload.chatID || payload.id);

        switch (type) {
          case 'create_message': {
            const freshChats = useChatStore.getState().chats;
            const targetChat = freshChats.find(c => c.id === chatId);
            const isCurrentChat = window.location.pathname === `/chats/${chatId}`;

            const currentUnread = typeof targetChat?.unreadCount === 'number' ? targetChat.unreadCount : 0;

            updateChat(chatId, {
              lastMessage: payload,
              unreadCount: isCurrentChat ? 0 : currentUnread + 1
            });

            if (isCurrentChat) {
              addMessage(payload);
              this.sendReadMessages(chatId, payload.id);
            }
            break;
          }

          case 'messages_read': {
            const freshChats = useChatStore.getState().chats;
            const targetChat = freshChats.find(c => c.id === chatId);

            if (Number(payload.userID) === currentUser?.id) {
              updateChat(chatId, { unreadCount: 0 });
            }

            if (targetChat && targetChat.participants) {
              const updatedParticipants = targetChat.participants.map(p =>
                p.id === Number(payload.userID) ? { ...p, lastReadMessageID: Number(payload.messageID) } : p
              );
              updateChat(chatId, { participants: updatedParticipants });
            }
            break;
          }

          case 'update_message': updateMessage(payload); break;
          case 'delete_message': deleteMessage({ id: payload.id }); break;
          case 'chat_created': addChat(payload); break;
          case 'user_status': updateParticipantStatus(payload.userId, payload.online); break;
          case 'chat_updated': updateChat(chatId, payload); break;
          case 'user_left_chat': {
            if (currentUser && payload.userId === currentUser.id) {
              removeChat(chatId);
              if (window.location.pathname === `/chats/${chatId}`) window.location.href = '/chats';
            } else {
              const freshChats = useChatStore.getState().chats;
              const targetChat = freshChats.find(c => c.id === chatId);
              if (targetChat?.participants) {
                const updated = targetChat.participants.filter(p => p.id !== payload.userId);
                updateChat(chatId, { participants: updated });
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error('Error processing WS message:', error);
      }
    };
  }

  public sendReadMessages(chatID: number, messageID: number) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'read_messages',
        payload: { chatID, messageID }
      }));
    }
  }
}

export const websocketService = new WebSocketService();