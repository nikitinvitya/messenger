import {api} from "@/shared/api";
import {User} from "@/entities/user";

interface UserSignInData {
  identifier: User['email'] | User['username'];
  password: User['password'];
}

export const signIn = (data: UserSignInData) => {
  return api.post('/auth/login', data)
}

export const resendVerification = (identifier: string) => {
  return api.post('/auth/resend-verification', { identifier });
}