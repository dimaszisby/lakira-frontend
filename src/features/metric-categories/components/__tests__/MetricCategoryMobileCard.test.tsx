import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricCategoryMobileCardBase } from "@/features/metric-categories/components/MetricCategoryMobileCard";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { metricCategoryRoutes } from "@/lib/routes";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const sampleCategory: MetricCategoryVM = {
  id: "cat-1",
  name: "Wellness",
  color: "#FF0000",
  icon: "🔥",
  metricCount: 5,
};

describe("MetricCategoryMobileCard", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("calls onClick handler when provided", () => {
    const handler = jest.fn();
    render(<MetricCategoryMobileCardBase category={sampleCategory} onClick={handler} />);

    fireEvent.click(screen.getByRole("button", { name: /open category wellness/i }));
    expect(handler).toHaveBeenCalledWith(sampleCategory);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls back to router push when no onClick", async () => {
    const user = userEvent.setup();

    render(<MetricCategoryMobileCardBase category={sampleCategory} />);

    await user.click(screen.getByRole("button", { name: /open category wellness/i }));
    expect(mockPush).toHaveBeenCalledWith(metricCategoryRoutes.detail(sampleCategory.id));
  });

  it("supports keyboard activation", async () => {
    const user = userEvent.setup();

    render(<MetricCategoryMobileCardBase category={sampleCategory} />);

    const trigger = screen.getByRole("button", { name: /open category wellness/i });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith(metricCategoryRoutes.detail(sampleCategory.id));
  });

  it("updates rendered content when category fields change for same id", () => {
    const { rerender } = render(<MetricCategoryMobileCardBase category={sampleCategory} />);
    expect(screen.getByText("Wellness")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    rerender(
      <MetricCategoryMobileCardBase
        category={{
          ...sampleCategory,
          name: "Hydration",
          metricCount: 9,
        }}
      />,
    );

    expect(screen.getByText("Hydration")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });
});
