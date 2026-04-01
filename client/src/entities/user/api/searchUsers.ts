import {UserSearchResponse} from "@/entities/user/model/model";
import {api} from "@/shared/api";

export const searchUsers = async (username: string): Promise<UserSearchResponse[]> => {
  const response = await api.get<UserSearchResponse[]>("/users/search", {
    params: {username}
  });

  return response.data;
}