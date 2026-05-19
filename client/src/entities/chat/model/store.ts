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
  upsertChat: (chat: Partial<Chat> & Pick<Chat, 'id' | 'type'>) => void;
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

  addChat: (chat) => set((state) => {
    const existing = state.chats.find((c) => c.id === chat.id);
    const merged: Chat = {
      ...existing,
      ...chat,
      id: chat.id,
      createdAt: chat.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
      participants: chat.participants ?? existing?.participants ?? [],
      lastMessage: chat.lastMessage ?? existing?.lastMessage,
      unreadCount: chat.unreadCount ?? existing?.unreadCount ?? 0,
    };
    return {
      chats: [merged, ...state.chats.filter((c) => c.id !== chat.id)],
    };
  }),

  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter((chat) => chat.id !== Number(chatId)),
  })),

  updateChat: (chatId, updatedFields) => set((state) => {
    const id = Number(chatId);
    const chatToUpdate = state.chats.find(c => c.id === id);

    if (!chatToUpdate) {
      if (updatedFields.id != null && updatedFields.type) {
        const newChat = {
          participants: [],
          createdAt: new Date().toISOString(),
          ...updatedFields,
          unreadCount: updatedFields.unreadCount ?? 0,
        } as Chat;
        const otherChats = state.chats.filter(c => c.id !== id);
        return { chats: [newChat, ...otherChats] };
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

  upsertChat: (chat) => set((state) => {
    const id = Number(chat.id);
    const existing = state.chats.find(c => c.id === id);
    const unreadCount = chat.unreadCount ?? existing?.unreadCount ?? 0;
    const merged: Chat = {
      participants: [],
      createdAt: new Date().toISOString(),
      ...existing,
      ...chat,
      id,
      lastMessage: chat.lastMessage ?? existing?.lastMessage,
      unreadCount,
    };
    const otherChats = state.chats.filter(c => c.id !== id);
    return { chats: [merged, ...otherChats] };
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