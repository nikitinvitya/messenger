import {User} from "@/entities/user";

export interface ChatApiResponse {
  chats: Chat[],
}

export interface LastMessage {
  id: number,
  content: string,
  createdAt: string,
}

export interface ChatParticipant extends User {
  lastReadMessageID?: number;
}

export interface Chat {
  id: number,
  type: 'private' | 'group'
  createdAt: string,
  name?: string;
  participants: ChatParticipant[],
  lastMessage?: LastMessage;
  avatarURL?: string;
  unreadCount: number;
}

