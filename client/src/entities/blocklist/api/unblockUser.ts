import { api } from '@/shared/api';

export const unblockUser = (userID: number) => {
  return api.delete(`/blocklist/${userID}`);
};
