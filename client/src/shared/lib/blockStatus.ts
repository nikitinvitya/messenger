import type { BlockStatus } from '@/entities/message';

export function blockStatusForUser(
  currentUserId: number,
  blockerId: number,
  blockedId: number,
): BlockStatus | null {
  if (currentUserId === blockerId) {
    return 'recipient_blocked';
  }
  if (currentUserId === blockedId) {
    return 'sender_blocked';
  }
  return null;
}

export function findPrivateChatIdWithUser(
  chats: { id: number; type?: string; participants?: { id: number }[] }[],
  otherUserId: number,
): number | undefined {
  const chat = chats.find(
    (c) =>
      c.type === 'private' &&
      c.participants?.some((p) => p.id === otherUserId),
  );
  return chat?.id;
}
