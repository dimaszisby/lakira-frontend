import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import MetricsPageClient from "@/app/(app)/metrics/_components/MetricsPageClient";
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
  usePathname: () => "/metrics",
  useSearchParams: () => new URLSearchParams(),
}));

const TIMESTAMP = "2026-02-18T08:00:00.000Z";

const initialParams: MetricListSearchParams = {
  ...DEFAULT_METRIC_LIST_PARAMS,
  mode: "pages",
};

function mockMetricsListResponse(items: Array<Record<string, unknown>>, totalCount: number) {
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

describe("MetricsPageClient integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockPrefetch.mockReset();
  });

  it("shows loading then renders fetched metrics list and prefetches metric detail", async () => {
    const metricId = "11111111-1111-4111-8111-111111111111";

    server.use(
      mockMetricsListResponse(
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
            createdAt: TIMESTAMP,
            updatedAt: TIMESTAMP,
          },
        ],
        1,
      ),
    );

    renderWithProviders(<MetricsPageClient initialParams={initialParams} />);

    expect(screen.getByRole("status", { name: /loading content/i })).toBeInTheDocument();
    expect(await screen.findByText("Body Weight")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockPrefetch).toHaveBeenCalledWith(`/metrics/${metricId}`);
    });
  });

  it("shows the server's message when deleting a metric is refused", async () => {
    const user = userEvent.setup();
    const metricId = "22222222-2222-4222-8222-222222222222";
    const refusal = "This metric still has logs and cannot be deleted";
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        mockMetricsListResponse(
          [
            {
              id: metricId,
              name: "Sleep",
              defaultUnit: "h",
              description: null,
              isPublic: false,
              originalMetricId: null,
              category: null,
              logCount: 3,
              goalType: null,
              createdAt: TIMESTAMP,
              updatedAt: TIMESTAMP,
            },
          ],
          1,
        ),
        http.delete("/api/proxy/metrics/:id", () =>
          HttpResponse.json({ status: "fail", message: refusal, data: null }, { status: 409 }),
        ),
      );

      renderWithProviders(<MetricsPageClient initialParams={initialParams} />);
      expect(await screen.findByText("Sleep")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /more actions/i }));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent(refusal);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("shows empty state when metrics response has no items", async () => {
    server.use(mockMetricsListResponse([], 0));

    renderWithProviders(<MetricsPageClient initialParams={initialParams} />);

    expect(await screen.findByRole("heading", { name: /no data available/i })).toBeInTheDocument();
    expect(screen.getByText(/you haven't created any data yet/i)).toBeInTheDocument();
  });

  it("navigates to create-metric modal when create button is clicked", async () => {
    const user = userEvent.setup();

    server.use(mockMetricsListResponse([], 0));

    renderWithProviders(<MetricsPageClient initialParams={initialParams} />);

    await screen.findByRole("heading", { name: /no data available/i });

    await user.click(screen.getByRole("button", { name: /create metric/i }));

    expect(mockPush).toHaveBeenCalledWith("/metrics/new");
  });

  it("has no critical accessibility violations in empty-state view", async () => {
    server.use(mockMetricsListResponse([], 0));

    const { container } = renderWithProviders(<MetricsPageClient initialParams={initialParams} />);

    await screen.findByRole("heading", { name: /no data available/i });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
