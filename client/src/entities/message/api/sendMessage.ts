import {api} from '@/shared/api';
import {Message} from '@/entities/message';

export const sendMessage = async (chatID: string, data: Message): Promise<Message> => {
  const response = await api.post(`/chats/${chatID}/messages`, data);

  return response.data;
};