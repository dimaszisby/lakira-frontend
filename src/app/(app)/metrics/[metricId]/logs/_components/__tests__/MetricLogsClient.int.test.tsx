import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http,HttpResponse } from "msw";

import { MetricDetailProvider } from "@/app/(app)/metrics/[metricId]/_components/MetricDetailContext";
import MetricLogsClient from "@/app/(app)/metrics/[metricId]/logs/_components/MetricLogsClient";
import { DEFAULT_METRIC_LOG_LIST_PARAMS } from "@/features/metric-logs/listSearchParams";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";
import type { MetricHeaderVM } from "@/features/metrics/view-models";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const metricId = "metric-1";
const fixedTimestamp = "2026-02-20T08:00:00.000Z";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => `/metrics/${metricId}/logs`,
  useSearchParams: () => new URLSearchParams(),
}));

const header: MetricHeaderVM = {
  id: metricId,
  name: "Body Weight",
  defaultUnit: "kg",
  description: "Weekly body-weight logs",
  isPublic: false,
  category: null,
  createdAt: fixedTimestamp,
  updatedAt: fixedTimestamp,
};

const settings: MetricSettingsExtendedVM | null = null;

function mockMetricLogsCursor(items: Array<Record<string, unknown>>, totalCount: number) {
  return http.get("/api/proxy/metric-logs", () =>
    HttpResponse.json({
      status: "success",
      message: "ok",
      data: {
        items,
        nextCursor: null,
        sort: "-createdAt",
        limit: 50,
        q: "",
        totalCount,
      },
    }),
  );
}

function renderMetricLogsClient() {
  return renderWithProviders(
    <MetricDetailProvider value={{ metricId, header, settings }}>
      <MetricLogsClient initialParams={DEFAULT_METRIC_LOG_LIST_PARAMS} />
    </MetricDetailProvider>,
  );
}

async function settleAsyncUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("MetricLogsClient integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(async () => {
    await settleAsyncUpdates();
  });

  it("shows empty state when logs response has no items", async () => {
    server.use(mockMetricLogsCursor([], 0));

    renderMetricLogsClient();

    expect(await screen.findByRole("heading", { name: /no data available/i })).toBeInTheDocument();
    expect(screen.getByText(/you haven't created any logs yet/i)).toBeInTheDocument();
  });

  it("renders fetched logs list when data exists", async () => {
    server.use(
      mockMetricLogsCursor(
        [
          {
            id: "log-1",
            metricId,
            logValue: 120,
            loggedAt: fixedTimestamp,
            type: "manual",
            createdAt: fixedTimestamp,
            updatedAt: fixedTimestamp,
          },
        ],
        1,
      ),
    );

    renderMetricLogsClient();

    await waitFor(() => {
      expect(screen.getAllByText("120").length).toBeGreaterThan(0);
    });
  });

  it("navigates to create-log modal when add button is clicked", async () => {
    const user = userEvent.setup();

    server.use(mockMetricLogsCursor([], 0));

    renderMetricLogsClient();
    await screen.findByRole("heading", { name: /no data available/i });

    await user.click(screen.getByRole("button", { name: /create new log/i }));

    expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}/logs/new`);
  });

  it("has no critical accessibility violations on empty-state view", async () => {
    server.use(mockMetricLogsCursor([], 0));

    const { container } = renderMetricLogsClient();
    await screen.findByRole("heading", { name: /no data available/i });
    await settleAsyncUpdates();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
