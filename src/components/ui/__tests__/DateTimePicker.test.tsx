import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DateTimePicker from "@/components/ui/DateTimePicker";

describe("DateTimePicker", () => {
  it("selects a date in date mode, normalizes to midnight, and closes popover", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const initial = new Date(2026, 1, 16, 9, 35);
    const { container } = render(<DateTimePicker mode="date" value={initial} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /choose date/i }));

    const targetDay = container.querySelector<HTMLButtonElement>(
      'button[data-date="2026-02-20"][data-current-month="true"]',
    );

    expect(targetDay).not.toBeNull();

    await user.click(targetDay as HTMLButtonElement);

    expect(onChange).toHaveBeenCalledTimes(1);

    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect(picked).toBeInstanceOf(Date);
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(1);
    expect(picked.getDate()).toBe(20);
    expect(picked.getHours()).toBe(0);
    expect(picked.getMinutes()).toBe(0);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps time when selecting date in datetime mode and closes on done", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const initial = new Date(2026, 1, 16, 13, 45);
    const { container } = render(<DateTimePicker mode="datetime" value={initial} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /choose date and time/i }));

    const targetDay = container.querySelector<HTMLButtonElement>(
      'button[data-date="2026-02-18"][data-current-month="true"]',
    );

    expect(targetDay).not.toBeNull();

    await user.click(targetDay as HTMLButtonElement);

    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(1);
    expect(picked.getDate()).toBe(18);
    expect(picked.getHours()).toBe(13);
    expect(picked.getMinutes()).toBe(45);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on escape and restores focus to trigger", async () => {
    const user = userEvent.setup();

    render(<DateTimePicker mode="date" value={new Date(2026, 1, 16)} onChange={() => {}} />);

    const trigger = screen.getByRole("button", { name: /choose date/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("respects minuteStep for datetime minute options", async () => {
    const user = userEvent.setup();

    render(
      <DateTimePicker
        mode="datetime"
        value={new Date(2026, 1, 16, 9, 12)}
        onChange={() => {}}
        minuteStep={15}
      />,
    );

    await user.click(screen.getByRole("button", { name: /choose date and time/i }));

    const minuteSelect = screen.getByRole("combobox", { name: /select minute/i });
    const values = Array.from(minuteSelect.querySelectorAll("option")).map((option) => option.value);

    expect(values).toEqual(["0", "15", "30", "45"]);
  });

  it("clamps datetime changes to min boundary", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DateTimePicker
        mode="datetime"
        value={new Date(2026, 1, 16, 13, 45)}
        onChange={onChange}
        min={new Date(2026, 1, 16, 14, 0)}
      />,
    );

    await user.click(screen.getByRole("button", { name: /choose date and time/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /select hour/i }), "12");

    const picked = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(picked).toBeInstanceOf(Date);
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(1);
    expect(picked.getDate()).toBe(16);
    expect(picked.getHours()).toBe(14);
    expect(picked.getMinutes()).toBe(0);
  });

  it("clamps datetime changes to max boundary", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DateTimePicker
        mode="datetime"
        value={new Date(2026, 1, 16, 15, 15)}
        onChange={onChange}
        max={new Date(2026, 1, 16, 16, 30)}
      />,
    );

    await user.click(screen.getByRole("button", { name: /choose date and time/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /select hour/i }), "6");

    const picked = onChange.mock.calls[0]?.[0] as Date;
    expect(picked).toBeInstanceOf(Date);
    expect(picked.getFullYear()).toBe(2026);
    expect(picked.getMonth()).toBe(1);
    expect(picked.getDate()).toBe(16);
    expect(picked.getHours()).toBe(16);
    expect(picked.getMinutes()).toBe(30);
  });
});
