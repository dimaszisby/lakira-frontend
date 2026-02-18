import { render, screen } from "@testing-library/react";

import { CategoryChipBase } from "@/features/metric-categories/components/CategoryChip";
import type { MetricCategoryUI } from "@/features/metric-categories/view-models";

describe("CategoryChip", () => {
  const chipLabel = "Category Wellness";
  const category: MetricCategoryUI = {
    id: "cat-1",
    name: "Wellness",
    color: "#FF0000",
    icon: "🔥",
  };

  it("renders primary variant with icon and category name", () => {
    render(<CategoryChipBase category={category} variant="primary" />);

    expect(screen.getByLabelText(chipLabel)).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("Wellness")).toBeInTheDocument();
  });

  it("renders secondary variant without icon", () => {
    render(<CategoryChipBase category={category} variant="secondary" />);

    expect(screen.getByLabelText(chipLabel)).toBeInTheDocument();
    expect(screen.queryByText("🔥")).not.toBeInTheDocument();
    expect(screen.getByText("Wellness")).toBeInTheDocument();
  });

  it("applies tinted background color for regular categories", () => {
    render(<CategoryChipBase category={category} variant="primary" />);

    expect(screen.getByText("Wellness")).toHaveStyle({ backgroundColor: "rgba(255, 0, 0, 0.2)" });
  });

  it("uses transparent background with fallback styling for white Uncategorized chips", () => {
    render(
      <CategoryChipBase
        category={{
          name: "Uncategorized",
          color: "#FFFFFF",
          icon: "🗂️",
        }}
        variant="secondary"
      />,
    );

    const label = screen.getByText("Uncategorized");
    expect(label).toHaveStyle({ backgroundColor: "transparent" });
    expect(label).toHaveClass("border", "bg-surface2");
  });

  it("merges external className on root element", () => {
    render(<CategoryChipBase category={category} className="custom-chip" />);

    expect(screen.getByLabelText(chipLabel)).toHaveClass("custom-chip");
  });
});
