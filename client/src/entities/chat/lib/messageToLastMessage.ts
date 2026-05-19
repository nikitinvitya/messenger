import type { LastMessage } from '@/entities/chat/model/model';

export function messagePayloadToLastMessage(payload: {
  id: number;
  content?: string;
  createdAt: string;
  imageURL?: string | null;
  type?: string;
}): LastMessage {
  const preview =
    payload.content?.trim() ||
    (payload.imageURL || payload.type === 'image' ? 'Photo' : '');

  return {
    id: payload.id,
    content: preview,
    createdAt: payload.createdAt,
  };
}
