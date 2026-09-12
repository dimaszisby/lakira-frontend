import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";

import type { SelectOption } from "@/components/ui/Select";
import { Select } from "@/components/ui/Select";

type OptionValue = "line" | "bar" | "area";

const CHART_TYPE = "Chart type";

const chartOptions: SelectOption<OptionValue>[] = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar", disabled: true },
  { value: "area", label: "Area" },
];

const Controlled = ({ initial, name }: { initial: OptionValue | null; name?: string }) => {
  const [value, setValue] = useState<OptionValue | null>(initial);
  return (
    <Select<OptionValue>
      name={name}
      value={value}
      onChange={(next) => setValue(next)}
      options={chartOptions}
      aria-label={CHART_TYPE}
    />
  );
};

const trigger = () => screen.getByRole("combobox", { name: CHART_TYPE });

describe("Select", () => {
  it("shows the placeholder and emits the chosen option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value={null}
        onChange={onChange}
        options={chartOptions}
        placeholder="Select chart"
        aria-label={CHART_TYPE}
      />,
    );

    expect(trigger()).toHaveTextContent("Select chart");

    await user.click(trigger());
    await user.click(await screen.findByRole("option", { name: "Line" }));

    expect(onChange).toHaveBeenCalledWith("line", expect.objectContaining({ label: "Line" }));
  });

  it("selects with the keyboard and skips disabled options", async () => {
    const user = userEvent.setup();

    render(<Controlled initial="line" />);

    await user.click(trigger());
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => expect(trigger()).toHaveTextContent("Area"));
  });

  it("marks the selected option", async () => {
    const user = userEvent.setup();

    render(<Controlled initial="area" />);

    await user.click(trigger());

    expect(await screen.findByRole("option", { name: "Area" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("submits the selected value with a form when named", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <form>
        <Controlled initial="line" name="chartType" />
      </form>,
    );

    const form = container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("chartType")).toBe("line");

    await user.click(trigger());
    await user.click(await screen.findByRole("option", { name: "Area" }));

    await waitFor(() => expect(new FormData(form).get("chartType")).toBe("area"));
  });

  it("closes on Escape without changing the selection", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value={null}
        onChange={onChange}
        options={chartOptions}
        aria-label={CHART_TYPE}
      />,
    );

    await user.click(trigger());
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <Select<OptionValue>
        value={null}
        onChange={() => {}}
        options={chartOptions}
        disabled
        aria-label={CHART_TYPE}
      />,
    );

    await user.click(trigger());

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not emit when the selected option is chosen again, and returns focus", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <Select<OptionValue>
        value="line"
        onChange={onChange}
        options={chartOptions}
        aria-label={CHART_TYPE}
      />,
    );

    await user.click(trigger());
    await user.click(await screen.findByRole("option", { name: "Line" }));

    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });
  });

  it("has no axe violations while open", async () => {
    const user = userEvent.setup();

    const { container } = render(<Controlled initial="line" />);

    await user.click(trigger());
    await screen.findByRole("listbox");

    expect(await axe(container)).toHaveNoViolations();
  });
});
