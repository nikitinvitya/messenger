import {api} from '@/shared/api';
import {Message} from '@/entities/message';

interface SendMessageProps {
  content: string;
  imageURL?: string;
  replyToMessageID?: number;
}

export const sendMessage = async (chatID: number, data:SendMessageProps): Promise<Message> => {
  const response = await api.post(`/chats/${chatID}/messages`, data);

  return response.data;
};