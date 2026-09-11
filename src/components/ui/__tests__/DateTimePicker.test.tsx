import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { DateTimePicker } from "@/components/ui/DateTimePicker";

const CHOOSE_DATE = /choose date$/i;
const CHOOSE_DATE_AND_TIME = /choose date and time/i;

const dayButton = (key: string) => {
  const button = document.querySelector<HTMLButtonElement>(
    `button[data-date="${key}"][data-current-month="true"]`,
  );
  if (!button) throw new Error(`Day ${key} not rendered`);
  return button;
};

const lastDate = (mock: jest.Mock) => mock.mock.calls.at(-1)?.[0] as Date;

describe("DateTimePicker", () => {
  it("selects a date in date mode, normalizes to midnight, and closes", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<DateTimePicker mode="date" value={new Date(2026, 1, 16, 9, 35)} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE }));
    await user.click(dayButton("2026-02-20"));

    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = lastDate(onChange);
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 1, 20]);
    expect([picked.getHours(), picked.getMinutes()]).toEqual([0, 0]);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the time when selecting a date in datetime mode and closes on Done", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DateTimePicker mode="datetime" value={new Date(2026, 1, 16, 13, 45)} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));
    await user.click(dayButton("2026-02-18"));

    const picked = lastDate(onChange);
    expect([picked.getDate(), picked.getHours(), picked.getMinutes()]).toEqual([18, 13, 45]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("focuses the selected day on open and moves by day and week with the arrow keys", async () => {
    const user = userEvent.setup();

    render(<DateTimePicker mode="date" value={new Date(2026, 1, 16)} onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE }));
    await waitFor(() => expect(dayButton("2026-02-16")).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    expect(dayButton("2026-02-17")).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(dayButton("2026-02-24")).toHaveFocus();
  });

  it("changes month with PageDown and keeps focus on a day", async () => {
    const user = userEvent.setup();

    render(<DateTimePicker mode="date" value={new Date(2026, 1, 16)} onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE }));
    await waitFor(() => expect(dayButton("2026-02-16")).toHaveFocus());

    await user.keyboard("{PageDown}");

    expect(screen.getByRole("grid", { name: /march 2026/i })).toBeInTheDocument();
    await waitFor(() => expect(dayButton("2026-03-01")).toHaveFocus());
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();

    render(<DateTimePicker mode="date" value={new Date(2026, 1, 16)} onChange={() => {}} />);

    const trigger = screen.getByRole("button", { name: CHOOSE_DATE });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("offers minutes in steps of minuteStep", async () => {
    const user = userEvent.setup();

    render(
      <DateTimePicker
        mode="datetime"
        value={new Date(2026, 1, 16, 9, 12)}
        onChange={() => {}}
        minuteStep={15}
      />,
    );

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));

    const minuteSelect = screen.getByRole("combobox", { name: /select minute/i });
    const values = Array.from(minuteSelect.querySelectorAll("option")).map(
      (option) => option.value,
    );
    expect(values).toEqual(["0", "15", "30", "45"]);
  });

  it("clamps time changes to the min boundary", async () => {
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

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));
    await user.selectOptions(screen.getByRole("combobox", { name: /select hour/i }), "12");

    const picked = lastDate(onChange);
    expect([picked.getDate(), picked.getHours(), picked.getMinutes()]).toEqual([16, 14, 0]);
  });

  it("clamps time changes to the max boundary", async () => {
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

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));
    await user.selectOptions(screen.getByRole("combobox", { name: /select hour/i }), "6");

    const picked = lastDate(onChange);
    expect([picked.getDate(), picked.getHours(), picked.getMinutes()]).toEqual([16, 16, 30]);
  });

  it("applies time changes to a just-picked date before the parent re-renders", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <DateTimePicker mode="datetime" value={new Date(2026, 1, 16, 13, 45)} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));
    await user.click(dayButton("2026-02-18"));
    await user.selectOptions(screen.getByRole("combobox", { name: /select minute/i }), "30");

    const picked = lastDate(onChange);
    expect([picked.getDate(), picked.getMinutes()]).toEqual([18, 30]);
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<DateTimePicker value={null} onChange={() => {}} disabled />);

    const trigger = screen.getByRole("button", { name: CHOOSE_DATE });
    expect(trigger).toBeDisabled();
    await user.click(trigger);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no axe violations while open", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <DateTimePicker mode="datetime" value={new Date(2026, 1, 16, 9, 0)} onChange={() => {}} />,
    );

    await user.click(screen.getByRole("button", { name: CHOOSE_DATE_AND_TIME }));
    await screen.findByRole("dialog");

    expect(await axe(container)).toHaveNoViolations();
  });
});
