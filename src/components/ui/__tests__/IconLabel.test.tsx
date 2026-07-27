import { render, screen } from "@testing-library/react";

import IconLabel from "@/components/ui/IconLabel";

type MockIconProps = {
  size?: number | string;
  weight?: string;
  className?: string;
};

const MockIcon = ({ size, weight, className }: MockIconProps) => (
  <svg
    data-testid="mock-icon"
    data-size={String(size)}
    data-weight={String(weight)}
    className={className}
    aria-hidden="true"
  />
);

describe("IconLabel", () => {
  it("renders label and icon with default muted tone", () => {
    render(<IconLabel icon={MockIcon} label="Private" />);

    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon")).toHaveAttribute("data-size", "16");
  });

  it("applies size and tone classes", () => {
    render(<IconLabel icon={MockIcon} label="Public" size="sm" tone="success" />);

    const wrapper = screen.getByText("Public").closest("span")?.parentElement;
    expect(wrapper).toHaveClass("text-xs");
    expect(wrapper).toHaveClass("text-status-success");
    expect(screen.getByTestId("mock-icon")).toHaveAttribute("data-size", "14");
  });
});
