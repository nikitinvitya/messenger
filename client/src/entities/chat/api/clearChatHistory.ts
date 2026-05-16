import { api } from '@/shared/api';

export const clearChatHistory = async (chatID: number): Promise<void> => {
  await api.delete(`/chats/${chatID}/history`);
};
