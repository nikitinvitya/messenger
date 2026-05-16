import type { Chat } from '../model/model';

export const SAVED_CHAT_DISPLAY_NAME = 'Saved Messages';

export function isSavedChat(chat: Pick<Chat, 'type'>): boolean {
  return chat.type === 'saved';
}

export function getChatDisplayName(
  chat: Pick<Chat, 'type' | 'name' | 'participants'>,
  currentUserId?: number,
): string {
  if (isSavedChat(chat)) {
    return chat.name?.trim() || SAVED_CHAT_DISPLAY_NAME;
  }
  if (chat.type === 'group' && chat.name) {
    return chat.name;
  }
  const partner = chat.participants?.find((p) => p.id !== currentUserId);
  if (partner) {
    return partner.username;
  }
  return 'Unknown';
}
