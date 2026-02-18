import type { QueryKey } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import type { ReactElement, ReactNode } from "react";

type InitialQueryDataEntry = {
  queryKey: QueryKey;
  data: unknown;
};

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper" | "queries"> & {
  queryClient?: QueryClient;
  route?: string;
  initialQueryData?: InitialQueryDataEntry[];
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    route,
    initialQueryData = [],
    ...renderOptions
  }: RenderWithProvidersOptions = {},
): RenderResult {
  if (route) {
    window.history.pushState({}, "Test page", route);
  }

  initialQueryData.forEach(({ queryKey, data }) => {
    queryClient.setQueryData(queryKey, data);
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </JotaiProvider>
  );

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

export { createTestQueryClient };
