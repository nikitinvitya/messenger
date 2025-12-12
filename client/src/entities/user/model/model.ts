export interface User {
  id: number,
  email: string,
  username: string,
  password?: string,
  createdAt: string,
}

export interface UserSearchResponse {
  id: number,
  username: string,
}