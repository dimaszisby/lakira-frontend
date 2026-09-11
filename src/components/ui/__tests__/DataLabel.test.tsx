import { render, screen } from "@testing-library/react";

import { DataLabel } from "@/components/ui/DataLabel";

describe("DataLabel", () => {
  it("renders the title and value at medium size by default", () => {
    render(<DataLabel title="Metric Name" value="123" />);

    expect(screen.getByText("Metric Name")).toBeInTheDocument();
    expect(screen.getByText("123").closest("[data-size]")).toHaveAttribute("data-size", "md");
  });

  it("forwards size and className to the root", () => {
    render(<DataLabel title="count" value="42" size="lg" className="custom-class" />);

    const root = screen.getByText("count").parentElement;
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveClass("custom-class");
  });

  it("prefers renderValue when provided", () => {
    render(
      <DataLabel
        title="Status"
        value="ignored"
        renderValue={<span data-testid="custom-value">Custom Content</span>}
      />,
    );

    expect(screen.getByTestId("custom-value")).toHaveTextContent("Custom Content");
    expect(screen.queryByText("ignored")).not.toBeInTheDocument();
  });

  it("formats booleans as explicit labels and null as empty", () => {
    const { rerender } = render(<DataLabel title="Visibility" value={false} />);
    expect(screen.getByText("False")).toBeInTheDocument();

    rerender(<DataLabel title="Visibility" value={null} />);
    expect(screen.queryByText("False")).not.toBeInTheDocument();
  });
});
