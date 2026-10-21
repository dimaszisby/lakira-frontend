import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import MetricCategoriesPageClient from "@/app/(app)/metric-categories/_components/MetricCategoriesPageClient";
import type { MetricCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";
import { DEFAULT_CATEGORY_LIST_PARAMS } from "@/features/metric-categories/listSearchParams";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/metric-categories",
  useSearchParams: () => new URLSearchParams(),
}));

const CREATED_AT = "2026-02-22T10:00:00.000Z";

const initialParams: MetricCategoryListSearchParams = {
  ...DEFAULT_CATEGORY_LIST_PARAMS,
  mode: "pages",
};

function mockCategoryListResponse(items: Array<Record<string, unknown>>, totalCount: number) {
  return http.get("/api/proxy/metric-categories", () =>
    HttpResponse.json({
      status: "success",
      message: "Categories fetched",
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

async function settleAsyncUpdates() {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("MetricCategoriesPageClient integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(async () => {
    await settleAsyncUpdates();
  });

  it("shows empty state when categories response has no items", async () => {
    server.use(mockCategoryListResponse([], 0));

    renderWithProviders(<MetricCategoriesPageClient initialParams={initialParams} />);

    expect(await screen.findByRole("heading", { name: /no categories yet/i })).toBeInTheDocument();
    expect(screen.getByText(/create a category to organize your metrics/i)).toBeInTheDocument();
    // The page's one h1 (register row F-63).
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "My Categories" })).toBeInTheDocument();
  });

  it("shows loading then renders fetched categories list", async () => {
    server.use(
      mockCategoryListResponse(
        [
          {
            id: "cat-1",
            name: "Wellness",
            color: "#E897A3",
            icon: "🔥",
            metricCount: 4,
            createdAt: CREATED_AT,
            updatedAt: CREATED_AT,
          },
        ],
        1,
      ),
    );

    renderWithProviders(<MetricCategoriesPageClient initialParams={initialParams} />);

    expect(screen.getByRole("status", { name: /loading content/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Wellness").length).toBeGreaterThan(0);
    });
  });

  // Register row F-34, owner question O-07. The categories list switches table and cards in CSS
  // at sm in both modes; its chips were shown in JavaScript below 1024 px, so a tablet got the
  // chips beside the table. They now hide with the cards.
  it.each(["pages", "scroll"] as const)(
    "shows its sort chips only with the card list, in %s mode",
    async (mode) => {
      server.use(
        mockCategoryListResponse(
          [
            {
              id: "cat-2",
              name: "Sleep",
              color: "#E897A3",
              icon: "🔥",
              metricCount: 1,
              createdAt: CREATED_AT,
              updatedAt: CREATED_AT,
            },
          ],
          1,
        ),
      );

      renderWithProviders(
        <MetricCategoriesPageClient initialParams={{ ...initialParams, mode }} />,
      );

      expect(await screen.findByRole("group", { name: "Sort options" })).toHaveClass("sm:hidden");
    },
  );

  it("navigates to create-category modal when create button is clicked", async () => {
    const user = userEvent.setup();

    server.use(mockCategoryListResponse([], 0));

    renderWithProviders(<MetricCategoriesPageClient initialParams={initialParams} />);
    await screen.findByRole("heading", { name: /no categories yet/i });

    await user.click(screen.getByRole("button", { name: /create category/i }));

    expect(mockPush).toHaveBeenCalledWith("/metric-categories/new");
  });

  it("has no critical accessibility violations in empty-state view", async () => {
    server.use(mockCategoryListResponse([], 0));

    const { container } = renderWithProviders(
      <MetricCategoriesPageClient initialParams={initialParams} />,
    );

    await screen.findByRole("heading", { name: /no categories yet/i });
    await settleAsyncUpdates();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
