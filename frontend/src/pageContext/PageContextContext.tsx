import { createContext, useContext, useState, type ReactNode } from "react";

export interface ViewedProduct {
  productId: string;
  productName: string;
}

interface PageContextValue {
  viewedProduct: ViewedProduct | null;
  setViewedProduct: (product: ViewedProduct | null) => void;
}

const PageContextContext = createContext<PageContextValue | null>(null);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [viewedProduct, setViewedProduct] = useState<ViewedProduct | null>(null);
  return (
    <PageContextContext.Provider value={{ viewedProduct, setViewedProduct }}>
      {children}
    </PageContextContext.Provider>
  );
}

export function usePageContext(): PageContextValue {
  const ctx = useContext(PageContextContext);
  if (!ctx) throw new Error("usePageContext must be used within PageContextProvider");
  return ctx;
}
