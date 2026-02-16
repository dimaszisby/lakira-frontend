import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Toggle from "@/components/ui/Toggle";

describe("Toggle", () => {
  it("renders as a switch and toggles on click", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable alerts" />);

    const control = screen.getByRole("switch", { name: /enable alerts/i });
    expect(control).not.toBeChecked();

    await user.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("supports keyboard activation without double-toggling", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={false} onCheckedChange={onCheckedChange} aria-label="Enable goal" />);

    const control = screen.getByRole("switch", { name: /enable goal/i });
    control.focus();

    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();

    render(<Toggle checked={true} onCheckedChange={onCheckedChange} disabled aria-label="Enable timeframe" />);

    const control = screen.getByRole("switch", { name: /enable timeframe/i });
    expect(control).toBeDisabled();

    await user.click(control);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("shows state labels when provided", () => {
    const { rerender } = render(
      <Toggle checked={false} onCheckedChange={() => {}} offLabel="OFF" onLabel="ON" aria-label="State" />,
    );

    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.queryByText("ON")).not.toBeInTheDocument();

    rerender(<Toggle checked onCheckedChange={() => {}} offLabel="OFF" onLabel="ON" aria-label="State" />);

    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.queryByText("OFF")).not.toBeInTheDocument();
  });
});
