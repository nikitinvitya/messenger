import {api} from '@/shared/api';
import {Message} from '@/entities/message';
import {mapMessage, mapSendMessageDataToApi, type SendMessageData} from './mapper';

export const sendMessage = async (chatID: string, data: SendMessageData): Promise<Message> => {
  const apiData = mapSendMessageDataToApi(data);

  const response = await api.post(`/chats/${chatID}/messages`, apiData);

  return mapMessage(response.data);
};