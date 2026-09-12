import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders with type button by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: /save/i })).toHaveAttribute("type", "button");
  });

  it("disables and marks busy while loading", () => {
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

  it("forwards ref as a prop", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);

    expect(ref.current).toBe(screen.getByRole("button", { name: /save/i }));
  });

  it("exposes variant and size to the recipe", () => {
    render(
      <Button variant="secondary" size="sm">
        Cancel
      </Button>,
    );

    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button).toHaveAttribute("data-variant", "secondary");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  it("warns in development for an icon-only button without an accessible name", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(<Button leftIcon={<span aria-hidden>+</span>} />);

    expect(warnSpy).toHaveBeenCalledWith(
      "[Button] Icon-only buttons must have an aria-label for accessibility.",
    );
    warnSpy.mockRestore();
  });

  it("does not warn for an icon-only button with an aria-label", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(<Button leftIcon={<span aria-hidden>+</span>} aria-label="Create" />);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Button loading leftIcon={<span aria-hidden>+</span>}>
        Save
      </Button>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
