import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

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

  describe("opening a log from the desktop table", () => {
    /**
     * The desktop table's only edit affordance is the row itself —
     * `LogDesktopTable` never reads `onEdit`, unlike the mobile card. So a
     * missing `onRowClick` does not degrade desktop editing, it removes it.
     *
     * Both queries below rely on `Table` setting `aria-label="View row details"`
     * and `tabIndex={0}` only when `onRowClick` is supplied, which is what makes
     * them fail against the unfixed client rather than silently pass.
     */
    const singleLog = () =>
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
      );

    const findDesktopRow = async () => {
      // jsdom applies no CSS, so the mobile list renders alongside the desktop
      // table. Scope to the table to avoid matching the card.
      const table = await screen.findByRole("table", { name: /metric logs table/i });
      return within(table).getByRole("row", { name: /view row details/i });
    };

    it("navigates to the log when its row is clicked", async () => {
      const user = userEvent.setup();
      server.use(singleLog());

      renderMetricLogsClient();

      await user.click(await findDesktopRow());

      expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}/logs/log-1`);
    });

    it("navigates to the log when its row is opened with Enter", async () => {
      const user = userEvent.setup();
      server.use(singleLog());

      renderMetricLogsClient();

      const row = await findDesktopRow();
      row.focus();
      await user.keyboard("{Enter}");

      expect(mockPush).toHaveBeenCalledWith(`/metrics/${metricId}/logs/log-1`);
    });

    // The pre-existing axe assertion covers the empty state only. Focusable rows
    // are new interactive surface, so the populated table needs its own pass.
    it("has no critical accessibility violations with rows interactive", async () => {
      server.use(singleLog());

      const { container } = renderMetricLogsClient();
      await findDesktopRow();
      await settleAsyncUpdates();

      expect(await axe(container)).toHaveNoViolations();
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
