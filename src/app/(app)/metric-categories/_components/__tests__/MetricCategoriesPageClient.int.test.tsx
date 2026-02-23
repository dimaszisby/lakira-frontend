import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http,HttpResponse } from "msw";

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
            createdAt: "2026-02-22T10:00:00.000Z",
            updatedAt: "2026-02-22T10:00:00.000Z",
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
