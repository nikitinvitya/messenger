import { create } from 'zustand';
import type {Message} from './model';

interface MessageState {
  messages: Message[];
}

interface MessageActions {
  setInitialMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (updatedMessage: Message) => void;
  deleteMessage: (payload: { id: number }) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageState & MessageActions>((set) => ({
  messages: [],

  setInitialMessages: (messages) => set({ messages }),

  addMessage: (newMessage) => set((state) => ({
    messages: state.messages.find(m => m.id === newMessage.id)
      ? state.messages
      : [...state.messages, newMessage],
  })),

  updateMessage: (updatedMessage) => set((state) => ({
    messages: state.messages.map(message =>
      message.id === updatedMessage.id ? updatedMessage : message
    ),
  })),

  deleteMessage: (payload) => set((state) => ({
    messages: state.messages.filter(message => message.id !== payload.id),
  })),

  clearMessages: () => set({ messages: [] }),
}));