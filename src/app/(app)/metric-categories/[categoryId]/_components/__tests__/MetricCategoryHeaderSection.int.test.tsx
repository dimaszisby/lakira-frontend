import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { MetricCategoryDetailProvider } from "@/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryDetailContext";
import MetricCategoryHeaderSection from "@/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryHeaderSection";
import { MetricCategoryReturnProvider } from "@/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryReturnContext";
import type { MetricCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    categoryId: "cat-1",
  }),
}));

const category: MetricCategoryVM = {
  id: "cat-1",
  name: "Wellness",
  color: "#E897A3",
  icon: "🔥",
  metricCount: 4,
  createdAt: "2026-02-20T08:00:00.000Z",
  updatedAt: "2026-02-21T08:00:00.000Z",
  deletedAt: null,
};

function renderHeader(returnParams: MetricCategoryListSearchParams | null = null) {
  return renderWithProviders(
    <MetricCategoryDetailProvider value={category}>
      <MetricCategoryReturnProvider value={returnParams}>
        <MetricCategoryHeaderSection />
      </MetricCategoryReturnProvider>
    </MetricCategoryDetailProvider>,
  );
}

describe("MetricCategoryHeaderSection integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders category detail labels and actions", () => {
    renderHeader();

    expect(screen.getByText("Wellness")).toBeInTheDocument();
    expect(screen.getByText("#E897A3")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to categories/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit category/i })).toBeInTheDocument();
  });

  it("navigates back to category list with serialized return params", async () => {
    const user = userEvent.setup();

    renderHeader({
      mode: "pages",
      page: 2,
      limit: 50,
      q: "well",
      sort: "-updatedAt",
    });

    await user.click(screen.getByRole("button", { name: /back to categories/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain("/metric-categories");
    expect(mockPush.mock.calls[0][0]).toContain("page=2");
    expect(mockPush.mock.calls[0][0]).toContain("q=well");
    expect(mockPush.mock.calls[0][0]).toContain("sort=-updatedAt");
  });

  it("navigates to edit category modal route", async () => {
    const user = userEvent.setup();

    renderHeader();

    await user.click(screen.getByRole("button", { name: /edit category/i }));

    expect(mockPush).toHaveBeenCalledWith("/metric-categories/cat-1/edit");
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderHeader();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
