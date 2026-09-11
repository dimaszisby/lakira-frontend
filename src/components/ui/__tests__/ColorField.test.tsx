import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ColorField } from "@/components/ui/ColorField";
import { DEFAULT_COLOR_HEX } from "@/constants/color-presets";

const CHART_COLOR = /chart color/i;
const OPEN_PICKER = /open color picker/i;

describe("ColorField", () => {
  it("normalizes a shorthand hex on blur", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value={null} onChange={onChange} aria-label="Chart color" />);

    const input = screen.getByRole("textbox", { name: CHART_COLOR });
    await user.clear(input);
    await user.type(input, "#abc");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith("#AABBCC");
  });

  it("reverts an invalid draft on blur without calling onChange", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value="#112233" onChange={onChange} aria-label="Chart color" />);

    const input = screen.getByRole("textbox", { name: CHART_COLOR });
    await user.clear(input);
    await user.type(input, "#12");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("#112233");
  });

  it("applies a preset colour from the picker and closes it", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value={null} onChange={onChange} aria-label="Chart color" />);

    await user.click(screen.getByRole("button", { name: OPEN_PICKER }));
    await user.click(await screen.findByRole("button", { name: /choose #e897a3/i }));

    expect(onChange).toHaveBeenCalledWith("#E897A3");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /choose color/i })).not.toBeInTheDocument(),
    );
  });

  it("disables Apply while the hex draft is invalid", async () => {
    const user = userEvent.setup();

    render(<ColorField value="#112233" onChange={() => {}} aria-label="Chart color" />);

    await user.click(screen.getByRole("button", { name: OPEN_PICKER }));
    const hexInput = await screen.findByRole("textbox", { name: /hex value/i });
    await user.clear(hexInput);
    await user.type(hexInput, "#12");

    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("closes the picker on Escape and returns focus to its button", async () => {
    const user = userEvent.setup();

    render(<ColorField value={null} onChange={() => {}} aria-label="Chart color" />);

    const openButton = screen.getByRole("button", { name: OPEN_PICKER });
    await user.click(openButton);
    await screen.findByRole("dialog", { name: /choose color/i });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /choose color/i })).not.toBeInTheDocument();
      expect(openButton).toHaveFocus();
    });
  });

  it("uses the shared default placeholder", () => {
    render(<ColorField value={null} onChange={() => {}} aria-label="Chart color" />);

    expect(screen.getByRole("textbox", { name: CHART_COLOR })).toHaveAttribute(
      "placeholder",
      DEFAULT_COLOR_HEX,
    );
  });

  it("labels itself when no aria-label is given", () => {
    render(<ColorField value={null} onChange={() => {}} />);

    expect(screen.getByRole("textbox", { name: "Color" })).toBeInTheDocument();
  });

  it("has no axe violations with the picker open", async () => {
    const user = userEvent.setup();

    const { container } = render(
      <ColorField value="#112233" onChange={() => {}} aria-label="Chart color" />,
    );

    await user.click(screen.getByRole("button", { name: OPEN_PICKER }));
    await screen.findByRole("dialog", { name: /choose color/i });

    expect(await axe(container)).toHaveNoViolations();
  });
});
