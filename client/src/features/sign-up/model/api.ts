import {api} from "@/shared/api";
import {User} from "@/entities/user";

interface UserSignUpDataData {
  email: User['email']
  username: User['username']
  password: User['password']
}


export const signUpByEmail = (data: UserSignUpDataData) => {
  return api.post('/auth/register', data)
}