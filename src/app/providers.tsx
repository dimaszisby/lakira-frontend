"use client";

import type { DehydratedState } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { THEME_STORAGE_KEY } from "@/constants/app";

export const Providers = ({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="data-theme" // we theme via [data-theme="dark"]
      // next-themes defaults this to "theme". `public/scripts/theme-init.js`
      // reads THEME_STORAGE_KEY before paint, so without this they used
      // different keys: the script never found a stored choice, fell back to
      // the system preference, and a user whose choice differed from their OS
      // got a flash of the wrong theme on every load.
      storageKey={THEME_STORAGE_KEY}
      defaultTheme="system" // explicit default (no system surprises)
      enableSystem
      disableTransitionOnChange // no janky transitions on toggle
    >
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          {/* Currently SSR is not being set yet */}
          {/* <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary> */}

          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
};
