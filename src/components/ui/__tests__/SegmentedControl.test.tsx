import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import type { SegmentOption } from "@/components/ui/SegmentedControl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type SegmentValue = "incremental" | "decremental" | "maintain";

const GOAL_TYPE = "Goal type";

const NUMERIC_OPTIONS: SegmentOption<number>[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "High" },
];

const options: SegmentOption<SegmentValue>[] = [
  { value: "incremental", label: "Incremental" },
  { value: "decremental", label: "Decremental", disabled: true },
  { value: "maintain", label: "Maintain", description: "Keep the value steady" },
];

const Controlled = ({ initial }: { initial: SegmentValue | null }) => {
  const [value, setValue] = useState<SegmentValue | null>(initial);
  return (
    <SegmentedControl<SegmentValue>
      value={value}
      onChange={(next) => setValue(next)}
      options={options}
      aria-label={GOAL_TYPE}
    />
  );
};

describe("SegmentedControl", () => {
  it("renders a labelled radio group with the selected option checked", () => {
    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={() => {}}
        options={options}
        aria-label={GOAL_TYPE}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: GOAL_TYPE })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Incremental" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Maintain" })).not.toBeChecked();
  });

  it("emits the value and option on click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        aria-label={GOAL_TYPE}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Maintain" }));

    expect(onChange).toHaveBeenCalledWith(
      "maintain",
      expect.objectContaining({ value: "maintain", label: "Maintain" }),
    );
  });

  it("moves and selects with arrow keys, skipping disabled options", async () => {
    const user = userEvent.setup();

    render(<Controlled initial="incremental" />);

    await user.tab();
    expect(screen.getByRole("radio", { name: "Incremental" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    const maintain = screen.getByRole("radio", { name: "Maintain" });
    expect(maintain).toHaveFocus();
    expect(maintain).toBeChecked();
  });

  it("lets keyboard users reach the group when nothing is selected", async () => {
    const user = userEvent.setup();

    render(<Controlled initial={null} />);

    await user.tab();

    expect(screen.getByRole("radio", { name: "Incremental" })).toHaveFocus();
  });

  it("does not emit when the whole control is disabled", async () => {
    // Ariakit blocks pointer events on disabled radios; force the click through to
    // prove the component's own guard also holds.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        disabled
        aria-label={GOAL_TYPE}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Maintain" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not emit when the selected option is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        aria-label={GOAL_TYPE}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Incremental" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("emits once for repeated clicks before the parent re-renders", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<SegmentValue>
        value="incremental"
        onChange={onChange}
        options={options}
        aria-label={GOAL_TYPE}
      />,
    );

    const maintain = screen.getByRole("radio", { name: "Maintain" });
    await user.click(maintain);
    await user.click(maintain);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("checks the option matching a numeric value", () => {
    render(
      <SegmentedControl<number>
        value={1}
        onChange={() => {}}
        options={[
          { value: 1, label: "Low" },
          { value: 2, label: "High" },
        ]}
        aria-label="Priority"
      />,
    );

    expect(screen.getByRole("radio", { name: "Low" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "High" })).not.toBeChecked();
  });

  it("checks the option when the value arrives after mount", () => {
    const priority = (value: number | null) => (
      <SegmentedControl<number>
        value={value}
        onChange={() => {}}
        options={NUMERIC_OPTIONS}
        aria-label="Priority"
      />
    );

    const { rerender } = render(priority(null));
    rerender(priority(1));

    expect(screen.getByRole("radio", { name: "Low" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "High" })).not.toBeChecked();
  });

  it("keeps the selected option checked when the enclosing form is reset", () => {
    // react-hook-form's bare reset() calls the native form.reset(), which restores
    // every associated radio to its initial state. Mounting with no value and
    // selecting later leaves that initial state unchecked.
    const priorityInForm = (value: number | null) => (
      <form aria-label="Settings">
        <SegmentedControl<number>
          value={value}
          onChange={() => {}}
          options={NUMERIC_OPTIONS}
          aria-label="Priority"
        />
      </form>
    );

    const { rerender } = render(priorityInForm(null));
    rerender(priorityInForm(1));
    expect(screen.getByRole("radio", { name: "Low" })).toBeChecked();

    act(() => {
      screen.getByRole<HTMLFormElement>("form", { name: "Settings" }).reset();
    });

    expect(screen.getByRole("radio", { name: "Low" })).toBeChecked();
  });

  it("supports numeric values", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <SegmentedControl<number>
        value={1}
        onChange={onChange}
        options={[
          { value: 1, label: "Low" },
          { value: 2, label: "High" },
        ]}
        aria-label="Priority"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "High" }));

    expect(onChange).toHaveBeenCalledWith(2, expect.objectContaining({ label: "High" }));
  });

  it("has no axe violations", async () => {
    const { container } = render(<Controlled initial="maintain" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
