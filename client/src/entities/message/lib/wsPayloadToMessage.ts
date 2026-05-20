import type { Message } from '@/entities/message/model/model';

type WsMessagePayload = {
  id: number;
  chatId: number;
  content?: string;
  createdAt: string;
  editedAt?: string | null;
  imageURL?: string | null;
  type?: string;
  replyToMessageId?: number | null;
  replyToMessageID?: number | null;
  forwardedFromUserId?: number | null;
  forwardedFromUserID?: number | null;
  forwardedFromChatId?: number | null;
  forwardedFromChatID?: number | null;
  sender: { id: number; username: string; avatarURL?: string | null };
};

export function wsPayloadToMessage(payload: WsMessagePayload): Message {
  const type =
    payload.type === 'image' || payload.type === 'system' ? payload.type : 'text';

  return {
    id: payload.id,
    chatId: payload.chatId,
    createdAt: payload.createdAt,
    content: payload.content ?? '',
    type,
    imageURL: payload.imageURL ?? undefined,
    editedAt: payload.editedAt ?? undefined,
    replyToMessageId:
      payload.replyToMessageId ?? payload.replyToMessageID ?? undefined,
    forwardedFromUserId:
      payload.forwardedFromUserId ?? payload.forwardedFromUserID ?? undefined,
    forwardedFromChatId:
      payload.forwardedFromChatId ?? payload.forwardedFromChatID ?? undefined,
    sender: {
      id: payload.sender.id,
      username: payload.sender.username,
      avatarURL: payload.sender.avatarURL ?? undefined,
    },
  };
}
