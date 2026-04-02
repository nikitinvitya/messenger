import {create} from "zustand/react";
import {Chat} from "./model";

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (chatId: number) => void;
  updateChat: (chatId: number, updatedChat: Partial<Chat>) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  chats: [],
  isLoading: false,
  error: null,

  setChats: (chats) => set({ chats, isLoading: false }),

  addChat: (chat) => set((state) => ({
    chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
  })),

  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter((chat) => chat.id !== chatId),
  })),

  updateChat: (chatId, updatedChat) => set((state) => {
    const chatToUpdate = state.chats.find(chat => chat.id === chatId)
    if(!chatToUpdate) {
      return state
    }
    const updatedInstance = {...chatToUpdate, ...updatedChat}
    return {
      chats: [updatedInstance, ...state.chats.filter(c => c.id !== chatId)]
    }
  }),

  setLoading: (isLoading) => set({ isLoading }),
}))