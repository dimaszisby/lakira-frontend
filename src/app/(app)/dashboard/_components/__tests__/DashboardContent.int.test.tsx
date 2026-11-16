import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import DashboardContent from "@/app/(app)/dashboard/_components/DashboardContent";
import type { DashboardVizItem, DashboardVizResponse } from "@/features/data-visualizations/types";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();
const DASHBOARD_ENDPOINT = "/api/proxy/analytics/dashboard";
const DASHBOARD_FETCHED_MESSAGE = "Dashboard fetched";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => mockSearchParams,
}));

const dashboardMeta = {
  bucket: "1d" as const,
  tz: "Asia/Jakarta",
  range: {
    startISO: "2026-01-01T00:00:00.000Z",
    endISO: "2026-01-31T23:59:59.000Z",
  },
  count: 1,
  fallbackMetrics: 0,
  totalMetrics: 1,
} satisfies DashboardVizResponse["meta"];

const REQUESTED_RANGE = {
  bucket: "1d" as const,
  startISO: dashboardMeta.range.startISO,
  endISO: dashboardMeta.range.endISO,
};

const BODY_WEIGHT = "Body Weight";

const dashboardItem = {
  metricId: "11111111-1111-4111-8111-111111111111",
  name: BODY_WEIGHT,
  unit: "kg",
  category_name: "Wellness",
  category_color: "#E897A3",
  category_icon: "🔥",
  priority: 1,
  series: [
    { bucketStartISO: "2026-01-01T00:00:00.000Z", value: 70 },
    { bucketStartISO: "2026-01-02T00:00:00.000Z", value: 69.8 },
    { bucketStartISO: "2026-01-03T00:00:00.000Z", value: 69.5 },
  ],
  stats: {
    average: 69.8,
    min: 69.5,
    max: 70,
    count: 3,
  },
  requestedRange: REQUESTED_RANGE,
  actualRange: REQUESTED_RANGE,
  fallbackRangeUsed: false,
  fallbackStrategy: null,
  firstLogAt: "2026-01-01T01:00:00.000Z",
  lastLogAt: "2026-01-03T01:00:00.000Z",
  latestBucketStart: "2026-01-03T00:00:00.000Z",
  latestValue: 69.5,
  totalLogs: 3,
} satisfies DashboardVizItem;

// No logs in January: the backend charts December instead, 1 to 30 Dec in Asia/Jakarta, with
// the end exclusive (midnight starting 31 Dec).
const fallbackItem = {
  ...dashboardItem,
  metricId: "22222222-2222-4222-8222-222222222222",
  name: "Sleep",
  actualRange: {
    bucket: "1d" as const,
    startISO: "2025-11-30T17:00:00.000Z",
    endISO: "2025-12-30T17:00:00.000Z",
  },
  fallbackRangeUsed: true,
  fallbackStrategy: "last_activity_window" as const,
} satisfies DashboardVizItem;

const FALLBACK_NOTICE = /no logs in the selected range/i;
const BANNER_TEXT = /no logs in the selected range, so/i;

const respondWith = (items: DashboardVizItem[], fallbackMetrics: number, delayMs = 0) =>
  server.use(
    http.get(DASHBOARD_ENDPOINT, async () => {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      return HttpResponse.json({
        status: "success",
        message: DASHBOARD_FETCHED_MESSAGE,
        data: {
          items,
          meta: { ...dashboardMeta, count: items.length, fallbackMetrics },
        },
      });
    }),
  );

describe("DashboardContent integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("shows loading skeleton then renders dashboard cards on success", async () => {
    server.use(
      http.get(DASHBOARD_ENDPOINT, async () => {
        await new Promise((resolve) => setTimeout(resolve, 120));
        return HttpResponse.json({
          status: "success",
          message: DASHBOARD_FETCHED_MESSAGE,
          data: {
            items: [dashboardItem],
            meta: dashboardMeta,
          },
        });
      }),
    );

    const { container } = renderWithProviders(<DashboardContent />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(await screen.findByText(BODY_WEIGHT)).toBeInTheDocument();
    expect(screen.getByText(/n:\s*3/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /metric chart for body weight/i }),
    ).toHaveAccessibleDescription(
      /average 69\.8 kg, minimum 69\.5 kg, maximum 70 kg, from 3 logs\.$/,
    );
  });

  it("shows empty state when dashboard items are empty", async () => {
    server.use(
      http.get(DASHBOARD_ENDPOINT, () =>
        HttpResponse.json({
          status: "success",
          message: DASHBOARD_FETCHED_MESSAGE,
          data: {
            items: [],
            meta: {
              ...dashboardMeta,
              count: 0,
            },
          },
        }),
      ),
    );

    renderWithProviders(<DashboardContent />);

    expect(await screen.findByText(/no dashboard metrics yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/mark some metrics to show on the dashboard in their settings/i),
    ).toBeInTheDocument();
  });

  it("shows error state when dashboard request fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.get(DASHBOARD_ENDPOINT, () =>
          HttpResponse.json(
            {
              status: "fail",
              message: "Bad request",
              data: null,
            },
            { status: 400 },
          ),
        ),
      );

      renderWithProviders(<DashboardContent />);

      expect(
        await screen.findByText(/something went wrong/i, {}, { timeout: 5000 }),
      ).toBeInTheDocument();
      // The server's own sentence, not Axios's "Request failed with status code 400".
      expect(screen.getByText("Bad request")).toBeInTheDocument();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("has no critical accessibility violations on empty dashboard state", async () => {
    server.use(
      http.get(DASHBOARD_ENDPOINT, () =>
        HttpResponse.json({
          status: "success",
          message: DASHBOARD_FETCHED_MESSAGE,
          data: {
            items: [],
            meta: {
              ...dashboardMeta,
              count: 0,
            },
          },
        }),
      ),
    );

    const { container } = renderWithProviders(<DashboardContent />);
    await screen.findByText(/no dashboard metrics yet/i);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("fallback range (#205)", () => {
    it("says nothing extra when no card falls back", async () => {
      respondWith([dashboardItem], 0);

      renderWithProviders(<DashboardContent />);

      expect(await screen.findByText(BODY_WEIGHT)).toBeInTheDocument();
      expect(screen.queryByText(FALLBACK_NOTICE)).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("tells a fallback card's dates, and only on that card", async () => {
      respondWith([dashboardItem, fallbackItem], 1);

      renderWithProviders(<DashboardContent />);

      const notice = await screen.findByText(
        "No logs in the selected range. Showing 1 Dec 2025 – 30 Dec 2025, the last period with logs.",
      );
      // The notice sits in the card's header, beside that card's title.
      expect(notice.closest("p")?.parentElement).toHaveTextContent("Sleep");
      expect(notice.closest("p")?.parentElement).not.toHaveTextContent(BODY_WEIGHT);
      expect(screen.getAllByText(FALLBACK_NOTICE)).toHaveLength(2); // the card, and the banner
    });

    it("shows one banner with the count, in the singular and the plural", async () => {
      respondWith([fallbackItem], 1);
      const { unmount } = renderWithProviders(<DashboardContent />);
      expect(
        await screen.findByText(
          "1 metric has no logs in the selected range, so its card shows the last period with logs.",
        ),
      ).toBeInTheDocument();
      unmount();

      respondWith(
        [fallbackItem, { ...fallbackItem, metricId: "33333333-3333-4333-8333-333333333333" }],
        2,
      );
      renderWithProviders(<DashboardContent />);
      await screen.findByText(BANNER_TEXT);
      expect(screen.getByRole("status")).toHaveTextContent(
        "2 metrics have no logs in the selected range, so their cards show the last period with logs.",
      );
    });

    it("hides the banner when dismissed, keeps the card's notice and moves focus to the cards", async () => {
      const user = userEvent.setup();
      respondWith([fallbackItem], 1);

      renderWithProviders(<DashboardContent />);

      await screen.findByText(BANNER_TEXT);
      await user.click(
        within(screen.getByRole("status")).getByRole("button", { name: "Dismiss notice" }),
      );

      expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
      expect(screen.getByText(FALLBACK_NOTICE)).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Dashboard metrics" })).toHaveFocus();
    });

    it("shows the banner again once the new range's data arrives, not before", async () => {
      const user = userEvent.setup();
      respondWith([fallbackItem], 1);

      const { rerender } = renderWithProviders(<DashboardContent />);
      await screen.findByText(BANNER_TEXT);
      await user.click(screen.getByRole("button", { name: "Dismiss notice" }));

      // A new range: the previous range's data stands in until the new response lands.
      respondWith([fallbackItem], 1, 150);
      mockSearchParams = new URLSearchParams("range=7d");
      rerender(<DashboardContent />);

      expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
      expect(await screen.findByText(BANNER_TEXT)).toBeInTheDocument();
    });

    it("has no accessibility violations with the banner and a fallback card", async () => {
      respondWith([dashboardItem, fallbackItem], 1);

      const { container } = renderWithProviders(<DashboardContent />);
      await screen.findByText(BANNER_TEXT);

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
