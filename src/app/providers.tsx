"use client";

import type { DehydratedState } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

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
