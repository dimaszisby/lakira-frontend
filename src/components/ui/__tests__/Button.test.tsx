import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders with button type by default", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toHaveAttribute("type", "button");
  });

  it("disables and sets aria-busy while loading", () => {
    render(<Button loading>Saving</Button>);

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("calls onClick when enabled", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Submit</Button>);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("warns in development for icon-only button without accessible name", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(<Button leftIcon={<span aria-hidden>+</span>} />);

    expect(warnSpy).toHaveBeenCalledWith(
      "[Button] Icon-only buttons must have an aria-label for accessibility.",
    );
    warnSpy.mockRestore();
  });

  it("does not warn for icon-only button with aria-label", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(<Button leftIcon={<span aria-hidden>+</span>} aria-label="Create" />);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
