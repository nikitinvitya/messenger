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
  updateChat: (chatId: number, updatedChat: Partial<Chat>) => void;
  setLoading: (isLoading: boolean) => void;
  updateParticipantStatus: (userId: number, isOnline: boolean) => void;
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
    const chatToUpdate = state.chats.find(c => c.id === chatId);

    if (!chatToUpdate) {
      const isFullChat =
        updatedChat.id !== undefined &&
        updatedChat.type !== undefined &&
        updatedChat.createdAt !== undefined;

      if (isFullChat) {
        return {
          chats: [updatedChat as Chat, ...state.chats]
        };
      }
      return state;
    }

    const mergedChat: Chat = {
      ...chatToUpdate,
      ...updatedChat
    };

    return {
      chats: [
        mergedChat,
        ...state.chats.filter(c => c.id !== chatId)
      ]
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