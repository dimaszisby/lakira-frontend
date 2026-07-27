import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import MetricListSection from "@/app/(app)/metric-categories/[categoryId]/_components/MetricListSection";
import type { MetricListSearchParams } from "@/features/metrics/listSearchParams";
import { DEFAULT_METRIC_LIST_PARAMS } from "@/features/metrics/listSearchParams";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
  usePathname: () => "/metric-categories/cat-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({
    categoryId: "cat-1",
  }),
}));

const initialParams: MetricListSearchParams = {
  ...DEFAULT_METRIC_LIST_PARAMS,
  mode: "pages",
};

function mockMetricsCursorResponse(items: Array<Record<string, unknown>>, totalCount: number) {
  return http.get("/api/proxy/metrics", () =>
    HttpResponse.json({
      status: "success",
      message: "Metrics fetched",
      data: {
        items,
        nextCursor: null,
        sort: "-createdAt",
        limit: 20,
        q: "",
        totalCount,
      },
    }),
  );
}

describe("MetricListSection integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockPrefetch.mockReset();
  });

  it("shows empty state when category has no metrics", async () => {
    server.use(mockMetricsCursorResponse([], 0));

    renderWithProviders(<MetricListSection initialParams={initialParams} />);

    expect(await screen.findByText("No Metrics")).toBeInTheDocument();
    expect(screen.getByText(/there are no metrics in this category yet/i)).toBeInTheDocument();
  });

  it("renders fetched metrics and prefetches detail on hover", async () => {
    const metricId = "11111111-1111-4111-8111-111111111111";
    const user = userEvent.setup();

    server.use(
      mockMetricsCursorResponse(
        [
          {
            id: metricId,
            name: "Body Weight",
            defaultUnit: "kg",
            description: "Weekly body weight tracking",
            isPublic: false,
            originalMetricId: null,
            category: {
              id: "cat-1",
              name: "Wellness",
              icon: "🔥",
              color: "#E897A3",
            },
            logCount: 12,
            goalType: "incremental",
            createdAt: "2026-02-18T08:00:00.000Z",
            updatedAt: "2026-02-18T08:00:00.000Z",
          },
        ],
        1,
      ),
    );

    renderWithProviders(<MetricListSection initialParams={initialParams} />);

    const metricCard = await screen.findByRole("button", { name: /open metric body weight/i });

    await user.hover(metricCard);

    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith(`/metrics/${metricId}`);
    });
  });

  it("navigates to metric routes from CTA and row click", async () => {
    const metricId = "11111111-1111-4111-8111-111111111111";
    const user = userEvent.setup();

    server.use(
      mockMetricsCursorResponse(
        [
          {
            id: metricId,
            name: "Body Weight",
            defaultUnit: "kg",
            description: "Weekly body weight tracking",
            isPublic: false,
            originalMetricId: null,
            category: {
              id: "cat-1",
              name: "Wellness",
              icon: "🔥",
              color: "#E897A3",
            },
            logCount: 12,
            goalType: "incremental",
            createdAt: "2026-02-18T08:00:00.000Z",
            updatedAt: "2026-02-18T08:00:00.000Z",
          },
        ],
        1,
      ),
    );

    renderWithProviders(<MetricListSection initialParams={initialParams} />);

    await user.click(screen.getByRole("button", { name: /add metric/i }));
    expect(mockPush).toHaveBeenCalledWith("/metrics/new");

    await user.click(await screen.findByRole("button", { name: /open metric body weight/i }));
    expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}`);
  });

  it("has no critical accessibility violations on empty-state view", async () => {
    server.use(mockMetricsCursorResponse([], 0));

    const { container } = renderWithProviders(<MetricListSection initialParams={initialParams} />);
    await screen.findByText("No Metrics");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
