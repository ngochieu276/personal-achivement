"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocaleStore } from "@/stores/locale";

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  useEffect(() => {
    document.documentElement.lang = locale === "vi" ? "vi" : "en";
  }, [locale]);

  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MotionConfig>
  );
}
