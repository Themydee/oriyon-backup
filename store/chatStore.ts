import { create } from "zustand";

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "visitor" | "agent" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export interface ChatThread {
  sessionId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatState {
  isOpen: boolean;
  activeSessionId: string | null;
  visitorName: string;
  visitorEmail: string;
  threads: ChatThread[];
  currentMessages: ChatMessage[];
  isAdminOnline: boolean;

  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setVisitorInfo: (name: string, email: string) => void;
  setActiveSessionId: (sessionId: string) => void;
  setThreads: (threads: ChatThread[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setIsAdminOnline: (online: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  activeSessionId: null,
  visitorName: "",
  visitorEmail: "",
  threads: [],
  currentMessages: [],
  isAdminOnline: true,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setVisitorInfo: (visitorName, visitorEmail) => set({ visitorName, visitorEmail }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  setThreads: (threads) => set({ threads }),
  setMessages: (currentMessages) => set({ currentMessages }),
  appendMessage: (message) =>
    set((state) => ({
      currentMessages: [...state.currentMessages, message],
    })),
  setIsAdminOnline: (isAdminOnline) => set({ isAdminOnline }),
}));
