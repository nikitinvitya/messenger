import {api} from './index';
import {useMessageStore} from '@/entities/message/model/store';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL;

interface WebSocketEvent {
  type: 'create_message' | 'update_message' | 'delete_message';
  payload: any;
}

interface DeletedMessagePayload {
  id: number;
  chat_id: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;

  private async getTicket(): Promise<string> {
    const response = await api.get<{ ticket: string }>('/auth/ws-ticket');
    return response.data.ticket;
  }

  public async connect(chatID: string): Promise<void> {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    try {
      const ticket = await this.getTicket();
      const url = `${WS_BASE_URL}/ws/chats/${chatID}?token=${ticket}`;
      this.socket = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to get WebSocket ticket:', error);
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

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
    };

    this.socket.onmessage = (event) => {
      try {
        console.log('Message from server:', event.data);
        const parsedEvent: WebSocketEvent = JSON.parse(event.data);

        const { addMessage, updateMessage, deleteMessage } = useMessageStore.getState();

        switch (parsedEvent.type) {
          case 'create_message':
          case 'update_message': {
            const message = parsedEvent.payload;
            addMessage(message);
            break;
          }

          case 'delete_message': {
            const payload = parsedEvent.payload as DeletedMessagePayload;
            deleteMessage({ id: payload.id });
            break;
          }

          default:
            console.warn('Unknown WebSocket event type:', parsedEvent.type);
        }
      } catch (error) {
        console.error('Failed to process WebSocket message:', error);
      }
    };


    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      this.socket = null;
    };
  }

  public sendMessage(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected.');
    }
  }
}

export const websocketService = new WebSocketService();