import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ColorField from "@/components/ui/ColorField";
import { DEFAULT_COLOR_HEX } from "@/constants/color-presets";

describe("ColorField", () => {
  it("normalizes shorthand hex on blur", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value={null} onChange={onChange} aria-label="Chart color" />);

    const input = screen.getByRole("textbox", { name: /chart color/i });
    await user.clear(input);
    await user.type(input, "#abc");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith("#AABBCC");
  });

  it("reverts invalid draft on blur without onChange", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value="#112233" onChange={onChange} aria-label="Chart color" />);

    const input = screen.getByRole("textbox", { name: /chart color/i });
    await user.clear(input);
    await user.type(input, "#12");
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /chart color/i })).toHaveValue("#112233");
  });

  it("applies selected quick palette color", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ColorField value={null} onChange={onChange} aria-label="Chart color" />);

    await user.click(screen.getByRole("button", { name: /open color picker/i }));
    await user.click(screen.getByRole("button", { name: /choose #e897a3/i }));

    expect(onChange).toHaveBeenCalledWith("#E897A3");
  });

  it("uses shared default placeholder when none provided", () => {
    render(<ColorField value={null} onChange={() => {}} aria-label="Chart color" />);

    expect(screen.getByRole("textbox", { name: /chart color/i })).toHaveAttribute(
      "placeholder",
      DEFAULT_COLOR_HEX,
    );
  });
});
