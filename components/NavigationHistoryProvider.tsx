"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface NavigationHistoryContextType {
  goBack: (fallback?: string) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

function NavigationHistoryTracker({ onUrlChange }: { onUrlChange: (url: string) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchString = searchParams.toString();
    const fullUrl = searchString ? `${pathname}?${searchString}` : pathname;
    onUrlChange(fullUrl);
  }, [pathname, searchParams, onUrlChange]);

  return null;
}

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();

  const handleUrlChange = useCallback((fullUrl: string) => {
    setHistory((prev) => {
      // Don't push duplicate consecutive URLs
      if (prev[prev.length - 1] === fullUrl) {
        return prev;
      }
      return [...prev, fullUrl];
    });
  }, []);

  const goBack = (fallback: string = "/admin") => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        // We only have the current page, or empty
        router.push(fallback);
        return prev;
      }

      const newHistory = [...prev];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1]; // Get the previous page

      router.push(previousPage);
      return newHistory;
    });
  };

  return (
    <NavigationHistoryContext.Provider value={{ goBack }}>
      <Suspense fallback={null}>
        <NavigationHistoryTracker onUrlChange={handleUrlChange} />
      </Suspense>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
}

