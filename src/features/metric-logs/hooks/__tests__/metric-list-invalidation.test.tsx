import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { metricsKeys } from "@/features/metrics/keys";
import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { deleteMetricLog } from "../../api";
import { useCreateMetricLog } from "../create.mutation";
import { useCreateMetricLogDummy } from "../create-dummy.mutation";
import { useDeleteMetricLog } from "../delete.mutation";
import { useUpdateMetricLog } from "../update.mutation";

/**
 * Each row of a metrics list carries its metric's log count, so creating or
 * deleting a log has to mark the metrics lists stale. Until #170 none did, and
 * a list visited within its 30 s stale time showed the old count.
 *
 * The API is mocked: what is under test is what the hook does once the call
 * succeeds, not what it sends.
 */
jest.mock("../../api", () => ({
  createMetricLog: jest.fn().mockResolvedValue({ id: "log-1" }),
  createMetricLogDummy: jest.fn().mockResolvedValue({ logs: [] }),
  updateMetricLog: jest.fn().mockResolvedValue({ id: "log-1" }),
  deleteMetricLog: jest.fn().mockResolvedValue(undefined),
}));

const OTHER_ORGANIZATION_ID = "other-org-00000000-0000-4000-8000-000000000000";
const METRIC_ID = "metric-1";
const LOG_ID = "log-1";

const pagesKey = (organizationId: string) =>
  metricsKeys.cursor.pages(organizationId, { limit: 20, sort: "-createdAt", page: 1 });

describe("metric-log mutations and the metrics lists", () => {
  const qc = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <OrganizationProvider organizationId={TEST_ORGANIZATION_ID}>{children}</OrganizationProvider>
    </QueryClientProvider>
  );

  const isListStale = (organizationId: string) =>
    qc.getQueryState(pagesKey(organizationId))?.isInvalidated === true;

  beforeEach(() => {
    qc.setQueryData(pagesKey(TEST_ORGANIZATION_ID), { seeded: true });
    qc.setQueryData(pagesKey(OTHER_ORGANIZATION_ID), { seeded: true });
  });

  afterEach(() => qc.clear());

  const expectOnlyThisOrganizationStale = () => {
    expect(isListStale(TEST_ORGANIZATION_ID)).toBe(true);
    expect(isListStale(OTHER_ORGANIZATION_ID)).toBe(false);
  };

  it("marks the metrics lists stale when a log is created", async () => {
    const { result } = renderHook(() => useCreateMetricLog(), { wrapper });

    await act(() => result.current.createMetricLog({ metricId: METRIC_ID } as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the metrics lists stale when dummy logs are generated", async () => {
    const { result } = renderHook(() => useCreateMetricLogDummy(), { wrapper });

    await act(() => result.current.createMetricLogDummy({ metricId: METRIC_ID } as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the metrics lists stale when a log is deleted", async () => {
    const { result } = renderHook(() => useDeleteMetricLog(), { wrapper });

    await act(() => result.current.deleteMetricLog({ logId: LOG_ID, metricId: METRIC_ID }));

    expectOnlyThisOrganizationStale();
  });

  it("marks the metrics lists stale when a delete fails, since the row was removed optimistically", async () => {
    jest.mocked(deleteMetricLog).mockRejectedValueOnce(new Error("refused"));
    const { result } = renderHook(() => useDeleteMetricLog(), { wrapper });

    await act(async () => {
      await expect(
        result.current.deleteMetricLog({ logId: LOG_ID, metricId: METRIC_ID }),
      ).rejects.toThrow();
    });

    expectOnlyThisOrganizationStale();
  });

  it("leaves the metrics lists fresh when a log is updated, since no count changes", async () => {
    const { result } = renderHook(() => useUpdateMetricLog(), { wrapper });

    await act(() =>
      result.current.updateMetricLog({ logId: LOG_ID, metricId: METRIC_ID, log: {} as never }),
    );

    expect(isListStale(TEST_ORGANIZATION_ID)).toBe(false);
  });
});
