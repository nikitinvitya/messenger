import { api } from '@/shared/api';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = (data: ChangePasswordPayload) => {
  return api.put('/users/me/password', data);
};
