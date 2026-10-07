import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { vizKeys } from "@/features/data-visualizations/keys";
import type { VizQuery } from "@/features/data-visualizations/types";
import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { useCreateMetric } from "../create.mutation";
import { useCreateMetricDummy } from "../create-dummy.mutation";
import { useDeleteMetric } from "../delete.mutation";
import { useUpdateMetric } from "../update.mutation";

/**
 * The dashboard lists metrics, so creating, renaming or deleting one changes
 * what it shows. Until 2026-10-07 no mutation marked the dashboard query stale.
 *
 * The API is mocked: what is under test is what the hook does once the call
 * succeeds, not what it sends.
 */
jest.mock("../../metric.api", () => ({
  createMetric: jest.fn().mockResolvedValue({ id: "metric-1" }),
  createMetricDummy: jest.fn().mockResolvedValue([]),
  updateMetric: jest.fn().mockResolvedValue({ id: "metric-1" }),
  deleteMetric: jest.fn().mockResolvedValue(undefined),
}));

const OTHER_ORGANIZATION_ID = "other-org-00000000-0000-4000-8000-000000000000";
const QUERY: VizQuery = { last: "7d", bucket: "1d" };
const METRIC_ID = "metric-1";

describe("metric mutations and the dashboard", () => {
  const qc = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <OrganizationProvider organizationId={TEST_ORGANIZATION_ID}>{children}</OrganizationProvider>
    </QueryClientProvider>
  );

  const isDashboardStale = (organizationId: string) =>
    qc.getQueryState(vizKeys.dashboard(organizationId, QUERY))?.isInvalidated === true;

  beforeEach(() => {
    qc.setQueryData(vizKeys.dashboard(TEST_ORGANIZATION_ID, QUERY), { seeded: true });
    qc.setQueryData(vizKeys.dashboard(OTHER_ORGANIZATION_ID, QUERY), { seeded: true });
  });

  afterEach(() => qc.clear());

  const expectOnlyThisOrganizationStale = () => {
    expect(isDashboardStale(TEST_ORGANIZATION_ID)).toBe(true);
    expect(isDashboardStale(OTHER_ORGANIZATION_ID)).toBe(false);
  };

  it("marks the dashboard stale when a metric is created", async () => {
    const { result } = renderHook(() => useCreateMetric(), { wrapper });

    await act(() => result.current.createMetric({} as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when dummy metrics are generated", async () => {
    const { result } = renderHook(() => useCreateMetricDummy(), { wrapper });

    await act(() => result.current.createMetricDummy({} as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a metric is updated", async () => {
    const { result } = renderHook(() => useUpdateMetric(), { wrapper });

    await act(() => result.current.updateMetric({ metricId: METRIC_ID, metric: {} as never }));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a metric is deleted", async () => {
    const { result } = renderHook(() => useDeleteMetric(), { wrapper });

    await act(() => result.current.deleteMetric(METRIC_ID));

    expectOnlyThisOrganizationStale();
  });
});
