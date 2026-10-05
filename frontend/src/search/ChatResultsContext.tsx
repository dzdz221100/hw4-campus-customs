import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductSummary } from "../api/products";

interface ChatSearchResults {
  query: string;
  products: ProductSummary[];
}

interface ChatResultsContextValue {
  results: ChatSearchResults | null;
  showResults: (query: string, products: ProductSummary[]) => void;
  clearResults: () => void;
}

const ChatResultsContext = createContext<ChatResultsContextValue | null>(null);

export function ChatResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ChatSearchResults | null>(null);

  const value: ChatResultsContextValue = {
    results,
    showResults: (query, products) => setResults({ query, products }),
    clearResults: () => setResults(null),
  };

  return <ChatResultsContext.Provider value={value}>{children}</ChatResultsContext.Provider>;
}

export function useChatResults(): ChatResultsContextValue {
  const ctx = useContext(ChatResultsContext);
  if (!ctx) throw new Error("useChatResults must be used within ChatResultsProvider");
  return ctx;
}
