import { render, screen } from "@testing-library/react";

import { IconLabel } from "@/components/ui/IconLabel";

const MockIcon = () => <svg data-testid="mock-icon" aria-hidden="true" />;

describe("IconLabel", () => {
  it("renders the label with a hidden icon and muted, medium defaults", () => {
    render(<IconLabel icon={MockIcon} label="Private" />);

    const root = screen.getByText("Private").parentElement;
    expect(root).toHaveAttribute("data-tone", "muted");
    expect(root).toHaveAttribute("data-size", "md");
    expect(screen.getByTestId("mock-icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes size and tone to the recipe", () => {
    render(<IconLabel icon={MockIcon} label="Public" size="sm" tone="success" />);

    const root = screen.getByText("Public").parentElement;
    expect(root).toHaveAttribute("data-tone", "success");
    expect(root).toHaveAttribute("data-size", "sm");
  });
});
