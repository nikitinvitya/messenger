import { getChatInfo } from '@/entities/chat/api/getChatInfo';
import { messagePayloadToLastMessage } from '@/entities/chat/lib/messageToLastMessage';
import { useChatStore } from '@/entities/chat/model/store';
import type { Message } from '@/entities/message/model/model';

type MessageLike = {
  id: number;
  content?: string;
  createdAt: string;
  imageURL?: string | null;
  type?: Message['type'] | string;
};

export async function applyMessageToChatList(
  chatId: number,
  message: MessageLike,
  options?: { isOwnMessage?: boolean; isCurrentChat?: boolean },
) {
  const isOwnMessage = options?.isOwnMessage ?? true;
  const isCurrentChat =
    options?.isCurrentChat ?? window.location.pathname === `/chats/${chatId}`;
  const lastMessage = messagePayloadToLastMessage(message);
  const { chats, updateChat, upsertChat } = useChatStore.getState();
  const existing = chats.find((c) => c.id === chatId);

  const unreadCount =
    isOwnMessage || isCurrentChat
      ? 0
      : (existing?.unreadCount ?? 0) + 1;

  if (existing) {
    updateChat(chatId, { lastMessage, unreadCount });
    return;
  }

  try {
    const chat = await getChatInfo(chatId);
    upsertChat({ ...chat, lastMessage, unreadCount });
  } catch {
  }
}
