import { render, screen } from "@testing-library/react";

import { CategoryChipBase } from "@/features/metric-categories/components/CategoryChip";
import type { MetricCategoryUI } from "@/features/metric-categories/view-models";

describe("CategoryChip", () => {
  const chipLabel = "Category Wellness";
  const TINT_CLASS = "category-color-bg";
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
   * are the contract. The recipe does the tinting, over a fixed base per theme
   * (ADR-0040), so the colour arrives as the user picked it.
   */
  it("passes the user's colour to the recipe as picked", () => {
    render(<CategoryChipBase category={category} variant="primary" />);

    const label = screen.getByText("Wellness");
    expect(label.style.getPropertyValue("--category-color")).toBe("#FF0000");
    expect(label).toHaveClass(TINT_CLASS);
  });

  // The tint is opaque on a base the theme fixes, so the theme's ink always meets 4.5:1 on it
  // (register row F-56); a colour-by-colour choice is what failed in the dark table.
  it.each(["#FFFFFF", "#D9D9D9", "#1A1A1A", "#000"] as const)(
    "uses the theme's ink when the colour is %s",
    (color) => {
      render(<CategoryChipBase category={{ ...category, color }} variant="secondary" />);

      const label = screen.getByText(category.name);
      expect(label).toHaveClass("text-ink");
      expect(label).not.toHaveClass("text-ink-inverted");
    },
  );

  it("falls back to token styling when the colour is not a hex value", () => {
    render(<CategoryChipBase category={{ ...category, color: "#GGGGGG" }} variant="secondary" />);

    const label = screen.getByText(category.name);
    expect(label).not.toHaveClass(TINT_CLASS);
    expect(label).toHaveClass("border", "bg-surface2");
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
    expect(label).not.toHaveClass(TINT_CLASS);
    expect(label).toHaveClass("border", "bg-surface2");
  });

  it("merges external className on root element", () => {
    render(<CategoryChipBase category={category} className="custom-chip" />);

    expect(screen.getByLabelText(chipLabel)).toHaveClass("custom-chip");
  });
});
