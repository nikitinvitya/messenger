import { api } from './index';
import { useMessageStore } from '@/entities/message/model/store';
import { useChatStore } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import {WS_BASE_URL} from "@/shared/constants/api"

type EventType = 'create_message' | 'update_message' | 'delete_message' | 'user_left_chat' | 'chat_created' | 'chat_deleted' | 'user_status' | 'chat_updated';

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
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

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
        const { removeChat, addChat, updateChat } = useChatStore.getState();
        const { user: currentUser } = useUserStore.getState();

        switch (type) {
          case 'create_message':
            updateChat(payload.chatId, { lastMessage: payload });

            if (window.location.pathname === `/chats/${payload.chatId}`) {
              addMessage(payload);
            }
            break;

          case 'update_message':
            updateMessage(payload);
            break;

          case 'delete_message':
            deleteMessage({ id: payload.id });
            break;

          case 'chat_created':
            addChat(payload);
            break;

          case 'user_left_chat':
            const eventUserId = payload.userId;
            const eventChatId = payload.chatId;
            console.log('User left event received:', { eventUserId, eventChatId, currentUserId: currentUser?.id });
            if (currentUser && payload.userId === currentUser.id) {
              removeChat(eventChatId);
              if (window.location.pathname === `/chats/${eventChatId}`) {
                window.location.href = '/chats';
              }
            } else {
              console.log('Other user left chat:', payload.userId);
            }
            break;

          case 'chat_deleted':
            const deletedChatId = payload.chatId || payload.chatID;
            console.log('WS: chat_deleted received for ID:', deletedChatId);

            if (deletedChatId) {
              removeChat(deletedChatId);
              if (window.location.pathname === `/chats/${deletedChatId}`) {
                window.location.href = '/chats';
              }
            }
            break;

          case 'user_status': {
            const { userId, online } = payload;

            useChatStore.getState().updateParticipantStatus(userId, online);

            const currentUser = useUserStore.getState().user;
            if (currentUser?.id === userId) {
              useUserStore.getState().updateStatus(online);
            }
            break;
          }

          case 'chat_updated': {
            console.log('Processing chat_updated for:', payload.id);
            updateChat(payload.id, payload);
            break;
          }
          default:
            console.warn('Unknown WebSocket event type:', type);
        }
      } catch (error) {
        console.error('Error processing WS message:', error);
      }
    };
  }
}

export const websocketService = new WebSocketService();