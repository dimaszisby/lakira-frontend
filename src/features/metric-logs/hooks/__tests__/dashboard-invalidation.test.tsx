import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { vizKeys } from "@/features/data-visualizations/keys";
import type { VizQuery } from "@/features/data-visualizations/types";
import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { useCreateMetricLog } from "../create.mutation";
import { useCreateMetricLogDummy } from "../create-dummy.mutation";
import { useDeleteMetricLog } from "../delete.mutation";
import { useUpdateMetricLog } from "../update.mutation";

/**
 * The dashboard charts are built from logged values, so every mutation of a
 * log has to mark the dashboard query stale. Until 2026-10-07 none did.
 *
 * The API is mocked: what is under test is what the hook does once the call
 * succeeds, not what it sends.
 */
jest.mock("../../api", () => ({
  createMetricLog: jest.fn().mockResolvedValue({ id: "log-1" }),
  createMetricLogDummy: jest.fn().mockResolvedValue([]),
  updateMetricLog: jest.fn().mockResolvedValue({ id: "log-1" }),
  deleteMetricLog: jest.fn().mockResolvedValue(undefined),
}));

const OTHER_ORGANIZATION_ID = "other-org-00000000-0000-4000-8000-000000000000";
const QUERY: VizQuery = { last: "7d", bucket: "1d" };
const METRIC_ID = "metric-1";
const LOG_ID = "log-1";

describe("metric-log mutations and the dashboard", () => {
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

  it("marks the dashboard stale when a log is created", async () => {
    const { result } = renderHook(() => useCreateMetricLog(), { wrapper });

    await act(() => result.current.createMetricLog({ metricId: METRIC_ID } as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when dummy logs are generated", async () => {
    const { result } = renderHook(() => useCreateMetricLogDummy(), { wrapper });

    await act(() => result.current.createMetricLogDummy({ metricId: METRIC_ID } as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a log is updated", async () => {
    const { result } = renderHook(() => useUpdateMetricLog(), { wrapper });

    await act(() =>
      result.current.updateMetricLog({ logId: LOG_ID, metricId: METRIC_ID, log: {} as never }),
    );

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a log is deleted", async () => {
    const { result } = renderHook(() => useDeleteMetricLog(), { wrapper });

    await act(() => result.current.deleteMetricLog({ logId: LOG_ID, metricId: METRIC_ID }));

    expectOnlyThisOrganizationStale();
  });
});
