import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { MouseEvent } from "react";

import { Toggle } from "@/components/ui/Toggle";

describe("Toggle", () => {
  it("renders as a switch and emits the next state on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable alerts" />);

    const control = screen.getByRole("switch", { name: /enable alerts/i });
    expect(control).not.toBeChecked();

    await user.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles once per keyboard activation", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable goal" />);

    screen.getByRole("switch", { name: /enable goal/i }).focus();
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(
      <Toggle checked onCheckedChange={onCheckedChange} disabled aria-label="Enable timeframe" />,
    );

    const control = screen.getByRole("switch", { name: /enable timeframe/i });
    expect(control).toBeDisabled();

    await user.click(control);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("shows the label for the current state only", () => {
    const { rerender } = render(
      <Toggle
        checked={false}
        onCheckedChange={() => {}}
        offLabel="OFF"
        onLabel="ON"
        aria-label="State"
      />,
    );

    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();

    rerender(
      <Toggle checked onCheckedChange={() => {}} offLabel="OFF" onLabel="ON" aria-label="State" />,
    );

    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.queryByText("OFF")).not.toBeInTheDocument();
  });

  it("preserves toggle intent on rapid clicks before the parent re-renders", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable alerts" />);

    const control = screen.getByRole("switch", { name: /enable alerts/i });
    await user.click(control);
    await user.click(control);

    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("does not emit onCheckedChange when the click default is prevented", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    const onClick = jest.fn((event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });

    render(
      <Toggle
        checked={false}
        onCheckedChange={onCheckedChange}
        onClick={onClick}
        aria-label="Enable alerts"
      />,
    );

    await user.click(screen.getByRole("switch", { name: /enable alerts/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("preserves toggle intent on rapid keyboard activation before the parent re-renders", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable alerts" />);

    screen.getByRole("switch", { name: /enable alerts/i }).focus();
    await user.keyboard(" ");
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Toggle checked onCheckedChange={() => {}} onLabel="ON" aria-label="Enable alerts" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
