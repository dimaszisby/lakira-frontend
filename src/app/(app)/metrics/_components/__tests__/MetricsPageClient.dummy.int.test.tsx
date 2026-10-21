import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import MetricsPageClient from "@/app/(app)/metrics/_components/MetricsPageClient";
import type { MetricListSearchParams } from "@/features/metrics/listSearchParams";
import { DEFAULT_METRIC_LIST_PARAMS } from "@/features/metrics/listSearchParams";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

/**
 * The "Add Dummy" button shows only when NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS is
 * set, so this file turns the flag on. It is a file of its own so that
 * `MetricsPageClient.int.test.tsx` keeps rendering the page as it ships.
 */
jest.mock("@/lib/env", () => ({
  ...jest.requireActual<Record<string, unknown>>("@/lib/env"),
  isDummyActionsEnabled: true,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/metrics",
  useSearchParams: () => new URLSearchParams(),
}));

const CARD_LIST = "Metrics mobile list";
const TIMESTAMP = "2026-02-18T08:00:00.000Z";

const initialParams: MetricListSearchParams = { ...DEFAULT_METRIC_LIST_PARAMS, mode: "pages" };

describe("MetricsPageClient with dummy actions on", () => {
  it("shows the delete error when a refused delete follows a refused dummy create", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.get("/api/proxy/metrics", () =>
          HttpResponse.json({
            status: "success",
            message: "Metrics fetched",
            data: {
              items: [
                {
                  id: "33333333-3333-4333-8333-333333333333",
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
              nextCursor: null,
              sort: "-createdAt",
              limit: 20,
              q: "",
              totalCount: 1,
            },
          }),
        ),
        http.post("/api/proxy/metrics/dummy", () =>
          HttpResponse.json(
            { status: "fail", message: "Dummy data is disabled on this server", data: null },
            { status: 403 },
          ),
        ),
        http.delete("/api/proxy/metrics/:id", () =>
          HttpResponse.json(
            { status: "fail", message: "This metric still has logs", data: null },
            { status: 409 },
          ),
        ),
      );

      renderWithProviders(<MetricsPageClient initialParams={initialParams} />);
      // Both variants render in paginated mode and CSS shows one; jsdom applies no CSS, so the
      // card list, which carries the swipe actions, is chosen explicitly (ADR-0035).
      const cards = within(await screen.findByRole("region", { name: CARD_LIST }));
      expect(cards.getByText("Sleep")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /add dummy/i }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/dummy data is disabled/i);

      await user.click(cards.getByRole("button", { name: /more actions/i }));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("This metric still has logs");
      });
      expect(screen.getByRole("alert")).not.toHaveTextContent(/dummy data is disabled/i);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
