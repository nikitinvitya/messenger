import type { Message, MessageApiResponse } from '@/entities/message';


export interface SendMessageData {
  content: string;
  replyToMessageId?: number;
}


interface ApiSendMessageData {
  content: string;
  reply_to_message_id?: number;
}

interface ApiMessage {
  id: number;
  chat_id: number;
  content: string;
  created_at: string;
  edited_at?: string;
  reply_to_message_id?: number;
  forwarded_from_user_id?: number;
  forwarded_from_chat_id?: number;
  sender: {
    id: number;
    username: string;
  };
}

interface ApiListMessagesResponse {
  messages: ApiMessage[];
  block_status: "none" | "sender_blocked" | "recipient_blocked";
}

export const mapSendMessageDataToApi = (data: SendMessageData): ApiSendMessageData => {
  return {
    content: data.content,
    reply_to_message_id: data.replyToMessageId,
  };
};

export const mapMessage = (data: ApiMessage): Message => {
  return {
    id: data.id,
    chatId: data.chat_id,
    content: data.content,
    createdAt: data.created_at,
    editedAt: data.edited_at,
    replyToMessageId: data.reply_to_message_id,
    forwardedFromUserId: data.forwarded_from_user_id,
    forwardedFromChatId: data.forwarded_from_chat_id,
    sender: data.sender,
  };
};

export const mapListMessagesResponse = (data: ApiListMessagesResponse): MessageApiResponse => {
  return {
    messages: data.messages.map(mapMessage),
    blockStatus: data.block_status,
  };
};