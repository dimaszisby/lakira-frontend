import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import type { SegmentOption } from "@/components/ui/SegmentedControl";
import SegmentedControl from "@/components/ui/SegmentedControl";

type SegmentValue = "incremental" | "decremental" | "maintain";

const options: SegmentOption<SegmentValue>[] = [
  { value: "incremental", label: "Incremental" },
  { value: "decremental", label: "Decremental", disabled: true },
  { value: "maintain", label: "Maintain" },
];

describe("SegmentedControl", () => {
  it("renders as a radiogroup and keeps selected option checked", () => {
    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={() => {}}
        options={options}
        aria-label="Goal type"
      />,
    );

    expect(screen.getByRole("radiogroup", { name: /goal type/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /incremental/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /maintain/i })).not.toBeChecked();
  });

  it("calls onChange with option metadata on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        aria-label="Goal type"
      />,
    );

    await user.click(screen.getByRole("radio", { name: /maintain/i }));

    expect(onChange).toHaveBeenCalledWith(
      "maintain",
      expect.objectContaining({ value: "maintain", label: "Maintain" }),
    );
  });

  it("supports keyboard navigation and skips disabled options", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState<SegmentValue | null>("incremental");
      return (
        <SegmentedControl<SegmentValue>
          value={value}
          onChange={(next) => setValue(next)}
          options={options}
          aria-label="Goal type"
        />
      );
    };

    render(<Harness />);

    const incremental = screen.getByRole("radio", { name: /incremental/i });
    incremental.focus();

    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: /maintain/i })).toBeChecked();
  });

  it("provides a focusable option when value is null", () => {
    render(
      <SegmentedControl<SegmentValue>
        value={null}
        onChange={() => {}}
        options={options}
        aria-label="Goal type"
      />,
    );

    expect(screen.getByRole("radio", { name: /incremental/i })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: /maintain/i })).toHaveAttribute("tabindex", "-1");
  });

  it("does not call onChange when control is disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        disabled
        aria-label="Goal type"
      />,
    );

    await user.click(screen.getByRole("radio", { name: /maintain/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not call onChange when selecting the already selected option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        aria-label="Goal type"
      />,
    );

    await user.click(screen.getByRole("radio", { name: /incremental/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
