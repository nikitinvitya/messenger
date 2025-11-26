import { Chat, LastMessage } from "../model/model";

export const mapLastMessage = (data: any): LastMessage | undefined => {
  if (!data) return undefined;

  return {
    id: data.id,
    content: data.content,
    createdAt: data.created_at,
  };
};

export const mapChat = (data: any): Chat => {
  return {
    id: data.id,
    type: data.type,
    createdAt: data.created_at,
    name: data.name,
    participants: data.participants,
    lastMessage: mapLastMessage(data.last_message),
  };
};

export const mapChatsResponse = (data: any): Chat[] => {
  return data.chats.map(mapChat);
};
