import { create } from "zustand";
import { Chat } from "./model";

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (chatId: number) => void;
  updateChat: (chatId: number | string, updatedFields: Partial<Chat>) => void;
  setLoading: (isLoading: boolean) => void;
  updateParticipantStatus: (userId: number, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  chats: [],
  isLoading: false,
  error: null,

  setChats: (chats) => set({
    chats: chats.map(c => ({ ...c, unreadCount: c.unreadCount || 0 })),
    isLoading: false
  }),

  addChat: (chat) => set((state) => ({
    chats: [
      { ...chat, unreadCount: chat.unreadCount || 0 },
      ...state.chats.filter((c) => c.id !== chat.id)
    ],
  })),

  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter((chat) => chat.id !== Number(chatId)),
  })),

  updateChat: (chatId, updatedFields) => set((state) => {
    const id = Number(chatId);
    const chatToUpdate = state.chats.find(c => c.id === id);

    if (!chatToUpdate) {
      if (updatedFields.id && updatedFields.type && updatedFields.createdAt) {
        return { chats: [{ ...updatedFields, unreadCount: updatedFields.unreadCount || 0 } as Chat, ...state.chats] };
      }
      return state;
    }

    const updatedChat = { ...chatToUpdate, ...updatedFields };
    const otherChats = state.chats.filter(c => c.id !== id);

    if (updatedFields.lastMessage) {
      return { chats: [updatedChat, ...otherChats] };
    }

    return {
      chats: state.chats.map((chat) => chat.id === id ? updatedChat : chat),
    };
  }),

  setLoading: (isLoading) => set({ isLoading }),

  updateParticipantStatus: (userId, isOnline) => set((state) => ({
    chats: state.chats.map(chat => ({
      ...chat,
      participants: chat.participants?.map(p =>
        p.id === userId ? { ...p, isOnline } : p
      )
    }))
  })),
}));