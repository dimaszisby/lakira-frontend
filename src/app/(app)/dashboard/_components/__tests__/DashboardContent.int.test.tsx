import { screen } from "@testing-library/react";
import { http,HttpResponse } from "msw";

import DashboardContent from "@/app/(app)/dashboard/_components/DashboardContent";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const DASHBOARD_ENDPOINT = "/api/proxy/analytics/dashboard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

const dashboardMeta = {
  bucket: "1d" as const,
  tz: "Asia/Jakarta",
  range: {
    startISO: "2026-01-01T00:00:00.000Z",
    endISO: "2026-01-31T23:59:59.000Z",
  },
  count: 1,
};

const dashboardItem = {
  metricId: "11111111-1111-4111-8111-111111111111",
  name: "Body Weight",
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
};

describe("DashboardContent integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("shows loading skeleton then renders dashboard cards on success", async () => {
    server.use(
      http.get(DASHBOARD_ENDPOINT, async () => {
        await new Promise((resolve) => setTimeout(resolve, 120));
        return HttpResponse.json({
          status: "success",
          message: "Dashboard fetched",
          data: {
            items: [dashboardItem],
            meta: dashboardMeta,
          },
        });
      }),
    );

    const { container } = renderWithProviders(<DashboardContent />);

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(await screen.findByText("Body Weight")).toBeInTheDocument();
    expect(screen.getByText(/n:\s*3/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /metric chart for 11111111-1111-4111-8111-111111111111/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when dashboard items are empty", async () => {
    server.use(
      http.get(DASHBOARD_ENDPOINT, () =>
        HttpResponse.json({
          status: "success",
          message: "Dashboard fetched",
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
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
