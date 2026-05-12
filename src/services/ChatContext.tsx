import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type SafeMessage } from '../hooks/useLiveChat';

interface ChatContextType {
  messages: SafeMessage[];
  setMessages: React.Dispatch<React.SetStateAction<SafeMessage[]>>;
  lastAdvice: string | null;
  setLastAdvice: (advice: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SafeMessage[]>(() => {
    try {
      const saved = localStorage.getItem('onyx_central_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [lastAdvice, setLastAdvice] = useState<string | null>(() => {
    return localStorage.getItem('onyx_last_advice');
  });

  useEffect(() => {
    localStorage.setItem('onyx_central_chat_history', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    if (lastAdvice) {
      localStorage.setItem('onyx_last_advice', lastAdvice);
    }
  }, [lastAdvice]);

  return (
    <ChatContext.Provider value={{ messages, setMessages, lastAdvice, setLastAdvice }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
