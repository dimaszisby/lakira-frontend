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

  /**
   * The colour reaches CSS as the `--category-color` custom property, which
   * `.category-color-bg` reads — an inline `backgroundColor` would put styling
   * in the markup where no recipe can reach it. jsdom loads no stylesheet, so
   * the computed background cannot be asserted here; the property and the class
   * are the contract.
   */
  it("passes the tinted colour to the recipe for regular categories", () => {
    render(<CategoryChipBase category={category} variant="primary" />);

    const label = screen.getByText("Wellness");
    expect(label.style.getPropertyValue("--category-color")).toBe("rgba(255, 0, 0, 0.2)");
    expect(label).toHaveClass("category-color-bg");
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
    // The fallback chip is painted by token classes, so it takes no recipe
    // colour at all rather than a transparent one.
    expect(label.style.getPropertyValue("--category-color")).toBe("transparent");
    expect(label).not.toHaveClass("category-color-bg");
    expect(label).toHaveClass("border", "bg-surface2");
  });

  it("merges external className on root element", () => {
    render(<CategoryChipBase category={category} className="custom-chip" />);

    expect(screen.getByLabelText(chipLabel)).toHaveClass("custom-chip");
  });
});
