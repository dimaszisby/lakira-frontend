import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import type {SelectOption} from "@/components/ui/Select";
import Select from "@/components/ui/Select";

type OptionValue = "line" | "bar" | "area";

const chartOptions: SelectOption<OptionValue>[] = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar", disabled: true },
  { value: "area", label: "Area" },
];

describe("Select", () => {
  it("renders placeholder and selects option on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value={null}
        onChange={onChange}
        options={chartOptions}
        placeholder="Select chart"
        aria-label="Chart type"
      />,
    );

    expect(screen.getByRole("button", { name: /chart type/i })).toHaveTextContent("Select chart");

    await user.click(screen.getByRole("button", { name: /chart type/i }));
    await user.click(screen.getByRole("option", { name: /line/i }));

    expect(onChange).toHaveBeenCalledWith("line", expect.objectContaining({ label: "Line" }));
  });

  it("supports keyboard navigation and skips disabled options", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState<OptionValue | null>(null);
      return (
        <Select<OptionValue>
          value={value}
          onChange={(nextValue) => setValue(nextValue)}
          options={chartOptions}
          aria-label="Chart type"
        />
      );
    };

    render(<Harness />);

    const trigger = screen.getByRole("button", { name: /chart type/i });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(trigger).toHaveTextContent("Area");
  });

  it("renders hidden input when name is provided", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState<OptionValue | null>("line");
      return (
        <Select<OptionValue>
          name="chartType"
          value={value}
          onChange={(nextValue) => setValue(nextValue)}
          options={chartOptions}
          aria-label="Chart type"
        />
      );
    };

    render(<Harness />);

    expect(screen.getByDisplayValue("line")).toHaveAttribute("name", "chartType");

    await user.click(screen.getByRole("button", { name: /chart type/i }));
    await user.click(screen.getByRole("option", { name: /area/i }));

    expect(screen.getByDisplayValue("area")).toHaveAttribute("name", "chartType");
  });

  it("closes on escape without changing selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value={null}
        onChange={onChange}
        options={chartOptions}
        aria-label="Chart type"
      />,
    );

    const trigger = screen.getByRole("button", { name: /chart type/i });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();

    render(
      <Select<OptionValue>
        value={null}
        onChange={() => {}}
        options={chartOptions}
        disabled
        aria-label="Chart type"
      />,
    );

    await user.click(screen.getByRole("button", { name: /chart type/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("falls back to first enabled option when selected option becomes disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value="bar"
        onChange={onChange}
        options={chartOptions}
        aria-label="Chart type"
      />,
    );

    const trigger = screen.getByRole("button", { name: /chart type/i });
    await user.click(trigger);
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("line", expect.objectContaining({ label: "Line" }));
  });
});
