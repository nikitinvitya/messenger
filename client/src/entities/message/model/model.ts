export interface Sender {
  id: number;
  username: string;
  avatarURL?: string;
}

export interface Message {
  id: number;
  chatId: number;
  createdAt: string;
  content: string;
  sender: Sender;
  editedAt?: string;
  replyToMessageId?: number;
  forwardedFromUserId?: number;
  forwardedFromChatId?: number;
  imageURL?: string;
  type: 'text' | 'image' | 'system';
}

export interface MessageApiResponse {
  messages: Message[],
  blockStatus: "none" | "sender_blocked" | "recipient_blocked"
}