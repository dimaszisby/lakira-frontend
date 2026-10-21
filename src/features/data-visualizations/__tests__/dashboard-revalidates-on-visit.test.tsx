import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { getDashboardVisualizations } from "../api";
import { useDashboardVisualizations } from "../hooks";
import { vizKeys } from "../keys";
import type { VizQuery } from "../types";

jest.mock("../api", () => ({
  getDashboardVisualizations: jest.fn().mockResolvedValue({ items: [], meta: {} }),
  getMetricVisualization: jest.fn(),
}));

const QUERY: VizQuery & { limit?: number } = { last: "30d", bucket: "1d", limit: 12 };

/**
 * A back navigation restores the dashboard with whatever the query cache holds. With a 60 s
 * `staleTime`, fresh-looking figures were shown after a log was deleted, and nothing refetched
 * them: the CI run of the stack suites caught it twice (register row F-67). Every visit
 * revalidates instead.
 */
describe("useDashboardVisualizations", () => {
  const qc = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <OrganizationProvider organizationId={TEST_ORGANIZATION_ID}>{children}</OrganizationProvider>
    </QueryClientProvider>
  );

  afterEach(() => {
    qc.clear();
    jest.mocked(getDashboardVisualizations).mockClear();
  });

  it("refetches on mount when the cached figures are still fresh", async () => {
    qc.setQueryData(vizKeys.dashboard(TEST_ORGANIZATION_ID, QUERY), { items: [], meta: {} });

    renderHook(() => useDashboardVisualizations(QUERY, { staleTime: 60_000 }), { wrapper });

    await waitFor(() => expect(getDashboardVisualizations).toHaveBeenCalledTimes(1));
  });
});
