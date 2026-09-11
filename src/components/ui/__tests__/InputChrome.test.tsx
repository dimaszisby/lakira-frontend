import { render, screen } from "@testing-library/react";

import { InputChrome } from "@/components/ui/InputChrome";

describe("InputChrome", () => {
  it("renders children and optional add-ons", () => {
    render(
      <InputChrome
        leftAddon={<span data-testid="left-addon">L</span>}
        rightAddon={<span data-testid="right-addon">R</span>}
      >
        <input aria-label="Name" />
      </InputChrome>,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("left-addon")).toBeInTheDocument();
    expect(screen.getByTestId("right-addon")).toBeInTheDocument();
  });

  it("exposes invalid, disabled, size and multiline state to the recipe", () => {
    const { container } = render(
      <InputChrome invalid disabled multiline size="lg">
        <textarea aria-label="Description" />
      </InputChrome>,
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveAttribute("data-invalid");
    expect(shell).toHaveAttribute("data-disabled");
    expect(shell).toHaveAttribute("data-multiline");
    expect(shell).toHaveAttribute("data-size", "lg");
  });

  it("omits state attributes by default", () => {
    const { container } = render(
      <InputChrome>
        <input aria-label="Email" />
      </InputChrome>,
    );

    const shell = container.firstElementChild;
    expect(shell).not.toHaveAttribute("data-invalid");
    expect(shell).not.toHaveAttribute("data-disabled");
    expect(shell).toHaveAttribute("data-size", "md");
  });
});
