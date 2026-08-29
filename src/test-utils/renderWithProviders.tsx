import type { QueryKey } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import type { ReactElement, ReactNode } from "react";

import { OrganizationProvider } from "@/features/organizations/context";

/**
 * Organization every test renders under, unless it overrides `organizationId`.
 *
 * Cache keys are tenant-scoped, so components calling `useOrganizationId()`
 * throw without a provider. Tests asserting isolation should pass a second id
 * explicitly rather than relying on this one.
 */
export const TEST_ORGANIZATION_ID = "test-org-00000000-0000-4000-8000-000000000000";

type InitialQueryDataEntry = {
  queryKey: QueryKey;
  data: unknown;
};

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper" | "queries"> & {
  queryClient?: QueryClient;
  route?: string;
  initialQueryData?: InitialQueryDataEntry[];
  /** Override the active organization, e.g. to assert cross-tenant isolation. */
  organizationId?: string;
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
    organizationId = TEST_ORGANIZATION_ID,
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
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider organizationId={organizationId}>{children}</OrganizationProvider>
      </QueryClientProvider>
    </JotaiProvider>
  );

  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

export { createTestQueryClient };
