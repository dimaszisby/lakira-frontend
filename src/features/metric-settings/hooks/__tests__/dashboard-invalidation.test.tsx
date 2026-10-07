import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { vizKeys } from "@/features/data-visualizations/keys";
import type { VizQuery } from "@/features/data-visualizations/types";
import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { useCreateMetricSettings } from "../create.mutation";
import { useDeleteMetricSettings } from "../delete.mutation";
import { useUpdateMetricSettings } from "../update.mutation";
import { useUpdateDisplayOptions } from "../update-display.mutation";
import { useUpdateGoalAchievement } from "../update-goal.mutation";

/**
 * A metric's settings decide whether it is on the dashboard at all
 * (`showOnDashboard`) and where (`priority`), so every write to them has to
 * mark the dashboard query stale. Found in review on 2026-10-07: the first
 * version of this fix covered logs and metrics and missed these.
 *
 * The API is mocked: what is under test is what the hook does once the call
 * succeeds, not what it sends.
 */
jest.mock("../../api", () => {
  const saved = { id: "settings-1" };
  return {
    createMetricSettings: jest.fn().mockResolvedValue(saved),
    deleteMetricSettings: jest.fn().mockResolvedValue(undefined),
    updateMetricSettings: jest.fn().mockResolvedValue(saved),
    updateDisplayOptions: jest.fn().mockResolvedValue(saved),
    updateGoalAchievement: jest.fn().mockResolvedValue(saved),
  };
});

const OTHER_ORGANIZATION_ID = "other-org-00000000-0000-4000-8000-000000000000";
const QUERY: VizQuery = { last: "7d", bucket: "1d" };
const METRIC_ID = "metric-1";
const SETTINGS_ID = "settings-1";

describe("metric-settings mutations and the dashboard", () => {
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

  it("marks the dashboard stale when settings are created", async () => {
    const { result } = renderHook(() => useCreateMetricSettings(), { wrapper });

    await act(() => result.current.createMetricSettings({} as never));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when settings are deleted", async () => {
    const { result } = renderHook(() => useDeleteMetricSettings(), { wrapper });

    await act(() => result.current.deleteMetricSettings({ id: SETTINGS_ID, metricId: METRIC_ID }));

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when settings are updated", async () => {
    const { result } = renderHook(() => useUpdateMetricSettings(), { wrapper });

    await act(() =>
      result.current.updateMetricSettings({
        settingsId: SETTINGS_ID,
        metricId: METRIC_ID,
        settings: {} as never,
      }),
    );

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when display options are updated", async () => {
    const { result } = renderHook(() => useUpdateDisplayOptions(), { wrapper });

    await act(() =>
      result.current.updateDisplayOptions({
        id: SETTINGS_ID,
        metricId: METRIC_ID,
        displayOptions: {} as never,
      }),
    );

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a goal is marked achieved", async () => {
    const { result } = renderHook(() => useUpdateGoalAchievement(), { wrapper });

    await act(() => result.current.updateGoalAchievement({ id: SETTINGS_ID, metricId: METRIC_ID }));

    expectOnlyThisOrganizationStale();
  });
});
