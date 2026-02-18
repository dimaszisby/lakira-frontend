import { render, screen } from "@testing-library/react";

import { DataLabelBase } from "@/components/ui/DataLabel";

describe("DataLabel", () => {
  it("renders default value text with medium sizing", () => {
    render(<DataLabelBase title="Metric Name" value="123" />);

    expect(screen.getByText("Metric Name")).toBeInTheDocument();
    const value = screen.getByText("123");
    expect(value).toHaveClass("text-body1");
  });

  it("supports overriding size and custom className", () => {
    render(<DataLabelBase title="count" value="42" size="lg" className="text-red-500" />);

    const container = screen.getByText("count").parentElement as HTMLElement;
    expect(container).toHaveClass("text-red-500");
    expect(screen.getByText("42")).toHaveClass("font-bold", "text-h4");
  });

  it("prefers renderValue when provided", () => {
    render(
      <DataLabelBase
        title="Status"
        value="ignored"
        renderValue={<span data-testid="custom-value">Custom Content</span>}
      />,
    );

    expect(screen.getByTestId("custom-value")).toHaveTextContent("Custom Content");
    expect(screen.queryByText("ignored")).not.toBeInTheDocument();
  });
});
