export interface User {
  id: number,
  email: string,
  username: string,
  password?: string,
  createdAt: string,
  bio?: string,
  avatarURL?: string,
  isOnline?: boolean,
}

export interface UserSearchResponse {
  id: number,
  username: string,
  bio?: string,
  avatarURL?: string,
  isOnline?: boolean,
}