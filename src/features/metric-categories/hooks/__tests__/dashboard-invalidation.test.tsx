import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { vizKeys } from "@/features/data-visualizations/keys";
import type { VizQuery } from "@/features/data-visualizations/types";
import { OrganizationProvider } from "@/features/organizations/context";
import { createTestQueryClient, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

import { useDeleteMetricCategory } from "../delete.mutation";
import { useUpdateMetricCategory } from "../update.mutation";

/**
 * Each dashboard item carries its category's name, colour and icon, so renaming
 * or deleting a category changes what the dashboard shows. Creating one does
 * not: no metric belongs to it yet. Found in review on 2026-10-07.
 *
 * The API is mocked: what is under test is what the hook does once the call
 * succeeds, not what it sends.
 */
jest.mock("../../api", () => ({
  updateMetricCategory: jest.fn().mockResolvedValue({ id: "category-1" }),
  deleteMetricCategory: jest.fn().mockResolvedValue(undefined),
}));

const OTHER_ORGANIZATION_ID = "other-org-00000000-0000-4000-8000-000000000000";
const QUERY: VizQuery = { last: "7d", bucket: "1d" };
const CATEGORY_ID = "category-1";

describe("metric-category mutations and the dashboard", () => {
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

  it("marks the dashboard stale when a category is updated", async () => {
    const { result } = renderHook(() => useUpdateMetricCategory(), { wrapper });

    await act(() =>
      result.current.updateMetricCategory({ categoryId: CATEGORY_ID, category: {} as never }),
    );

    expectOnlyThisOrganizationStale();
  });

  it("marks the dashboard stale when a category is deleted", async () => {
    const { result } = renderHook(() => useDeleteMetricCategory(), { wrapper });

    await act(() => result.current.deleteMetricCategory(CATEGORY_ID));

    expectOnlyThisOrganizationStale();
  });
});
