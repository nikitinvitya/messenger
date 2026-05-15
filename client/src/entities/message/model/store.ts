import { create } from 'zustand';
import type { Message, MessageApiResponse } from './model';

export type BlockStatus = MessageApiResponse['blockStatus'];

interface MessageState {
  messages: Message[];
  blockStatus: BlockStatus;
  editingMessage: Message | null;
  replyingToMessage: Message | null;
  forwardingMessage: Message | null;
}

interface MessageActions {
  setInitialMessages: (messages: Message[]) => void;
  setBlockStatus: (status: BlockStatus) => void;
  addMessage: (message: Message) => void;
  updateMessage: (updatedMessage: Message) => void;
  deleteMessage: (payload: { id: number }) => void;
  clearMessages: () => void;
  setEditingMessage: (message: Message | null) => void;
  setReplyingToMessage: (message: Message | null) => void;
  setForwardingMessage: (message: Message | null) => void;
}

export const useMessageStore = create<MessageState & MessageActions>((set) => ({
  messages: [],
  blockStatus: 'none',
  editingMessage: null,
  replyingToMessage: null,
  forwardingMessage: null,

  setInitialMessages: (messages) => set({ messages }),

  setBlockStatus: (status) => set({ blockStatus: status }),

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

  clearMessages: () => set({ messages: [], blockStatus: 'none' }),

  setEditingMessage: (message) => set({ editingMessage: message, replyingToMessage: null }),

  setReplyingToMessage: (message) => set({ replyingToMessage: message, editingMessage: null }),

  setForwardingMessage: (message) => set({ forwardingMessage: message }),
}));