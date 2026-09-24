"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { THEME_STORAGE_KEY } from "@/constants/app";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="data-theme" // we theme via [data-theme="dark"]
      // next-themes defaults this to "theme". Users already have their choice
      // stored under THEME_STORAGE_KEY, and next-themes' pre-paint script reads
      // whatever key is set here — so a mismatch resets every stored choice to
      // the OS setting.
      storageKey={THEME_STORAGE_KEY}
      defaultTheme="system" // explicit default (no system surprises)
      enableSystem
      disableTransitionOnChange // no janky transitions on toggle
    >
      <JotaiProvider>
        {/* Server-prefetched state is hydrated per route, not here: a route that
            prefetches wraps its own subtree in <HydrationBoundary>, as
            (app)/dashboard/page.tsx does. This used to carry an unused
            `dehydratedState` prop and a commented-out boundary for a global
            version that was never wired up, plus a second QueryClientProvider
            nested inside the first on the same client. */}
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
};
