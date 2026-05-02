import {User} from "./model";
import {create} from "zustand/react";
import {api} from "@/shared/api";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const defaultUserState: UserState = {
  error: null,
  isLoading: true,
  user: null,
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  error: defaultUserState.error,
  isLoading: defaultUserState.isLoading,
  user: defaultUserState.user,

  fetchUser: async () => {
    set({isLoading: true, error: null})
    try {
      const response = await api.get('/users/me')
      set({user: response.data})
    } catch (error) {
      set({user: null, error: 'Session expired'})
    } finally {
      set({isLoading: false})
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, error: null });
    } catch (error) {
      console.error('Logout failed:', error);
      set({error: 'Logout failed' });
    } finally {
      set({ isLoading: false })
    }
  },

  setUser: (u: User) => {
    set({user: u})
  }
}))