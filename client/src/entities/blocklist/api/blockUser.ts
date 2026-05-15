import { api } from '@/shared/api';

export const blockUser = (userID: number) => {
  return api.post(`/blocklist/${userID}`);
};
