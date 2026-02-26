import { fireEvent, render, screen } from "@testing-library/react";

import GranularityPicker from "@/features/data-visualizations/components/GranularityPicker";

describe("GranularityPicker", () => {
  it("renders all supported granularity options", () => {
    render(<GranularityPicker value="1d" onChange={() => {}} />);

    expect(screen.getByRole("option", { name: "Hourly" })).toHaveValue("1h");
    expect(screen.getByRole("option", { name: "Daily" })).toHaveValue("1d");
    expect(screen.getByRole("option", { name: "Weekly" })).toHaveValue("1w");
    expect(screen.getByRole("option", { name: "Monthly" })).toHaveValue("1m");
    expect(screen.getByRole("option", { name: "Yearly" })).toHaveValue("1y");
  });

  it("emits selected granularity alias", () => {
    const onChange = jest.fn();
    render(<GranularityPicker value="1d" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Granularity"), {
      target: { value: "1w" },
    });

    expect(onChange).toHaveBeenCalledWith("1w");
  });

  it("supports custom aria-label and className", () => {
    render(
      <GranularityPicker
        value="1m"
        onChange={() => {}}
        aria-label="Bucket interval"
        className="test-picker-class"
      />,
    );

    const select = screen.getByLabelText("Bucket interval");
    expect(select).toHaveClass("test-picker-class");
  });

  it("passes through native select props", () => {
    render(<GranularityPicker value="1h" onChange={() => {}} disabled data-testid="granularity" />);

    const select = screen.getByTestId("granularity");
    expect(select).toBeDisabled();
  });
});
