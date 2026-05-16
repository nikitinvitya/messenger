import { api } from './index';
import { useMessageStore } from '@/entities/message/model/store';
import { useChatStore } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import { WS_BASE_URL, BACKEND_ORIGIN } from '@/shared/constants/api';
import { showBrowserNotification } from "@/shared/lib/showNotification";
import { blockStatusForUser, findPrivateChatIdWithUser } from "@/shared/lib/blockStatus";
import { AppRoutes } from "@/shared/config/routes";

type EventType =
  | 'create_message'
  | 'update_message'
  | 'delete_message'
  | 'user_left_chat'
  | 'chat_created'
  | 'chat_deleted'
  | 'user_status'
  | 'chat_updated'
  | 'messages_read'
  | 'user_blocked'
  | 'user_unblocked';

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
    } catch {
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
        const { addMessage, updateMessage, deleteMessage, setBlockStatus } = useMessageStore.getState();
        const { removeChat, addChat, updateChat, updateParticipantStatus } = useChatStore.getState();
        const { user: currentUser } = useUserStore.getState();

        const chatId = Number(payload.chatId || payload.chatID || payload.id);
        const mediaOrigin = BACKEND_ORIGIN;

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

            if (payload.sender.id !== currentUser?.id) {
              if (document.visibilityState !== 'visible' || !isCurrentChat) {
                const iconUrl =
                  payload.sender.avatarURL && mediaOrigin
                    ? `${mediaOrigin}${payload.sender.avatarURL}`
                    : undefined;

                let title = payload.sender.username;
                let body = payload.content || "Sent an image";

                if (targetChat?.type === 'group') {
                  title = targetChat.name || "Group";
                  body = `${payload.sender.username}: ${body}`;
                }

                showBrowserNotification({
                  title,
                  body,
                  icon: iconUrl,
                  onClick: () => {
                    window.focus();
                    window.location.href = `/chats/${chatId}`;
                  }
                });
              }
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
              if (window.location.pathname === `/chats/${chatId}`) window.location.href = AppRoutes.chats;
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

          case 'chat_deleted': {
            const deletedChatId = Number(payload.chatId ?? payload.chatID);
            if (!deletedChatId) break;
            removeChat(deletedChatId);
            if (window.location.pathname === `/chats/${deletedChatId}`) {
              window.location.href = AppRoutes.chats;
            }
            break;
          }

          case 'user_blocked':
          case 'user_unblocked': {
            if (!currentUser) break;
            const blockerId = Number(payload.blockerId);
            const blockedId = Number(payload.blockedId);
            const activeChatId = Number(window.location.pathname.split('/').pop());
            const chats = useChatStore.getState().chats;

            const relatedChatId =
              findPrivateChatIdWithUser(chats, blockerId === currentUser.id ? blockedId : blockerId) ??
              (Number.isFinite(activeChatId) ? activeChatId : undefined);

            if (relatedChatId && window.location.pathname === `/chats/${relatedChatId}`) {
              if (type === 'user_unblocked') {
                setBlockStatus('none');
              } else {
                const status = blockStatusForUser(currentUser.id, blockerId, blockedId);
                if (status) setBlockStatus(status);
              }
            }
            break;
          }
        }
      } catch {
      }
    };
  }

  public sendReadMessages(chatID: number, messageID: number) {
    const send = () => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          type: 'read_messages',
          payload: { chatID, messageID }
        }));
        return true;
      }
      return false;
    };

    if (!send()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (send() || attempts > 5) {
          clearInterval(interval);
        }
      }, 500);
    }
  }
}

export const websocketService = new WebSocketService();