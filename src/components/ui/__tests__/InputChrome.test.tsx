import { render, screen } from "@testing-library/react";

import InputChrome from "@/components/ui/InputChrome";

describe("InputChrome", () => {
  it("renders children and optional add-ons", () => {
    render(
      <InputChrome leftAddon={<span data-testid="left-addon">L</span>} rightAddon={<span data-testid="right-addon">R</span>}>
        <input aria-label="Name" />
      </InputChrome>,
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByTestId("left-addon")).toBeInTheDocument();
    expect(screen.getByTestId("right-addon")).toBeInTheDocument();
  });

  it("applies error and disabled visual states", () => {
    const { container } = render(
      <InputChrome hasError disabled>
        <input aria-label="Email" />
      </InputChrome>,
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveClass("border-status-error");
    expect(shell).toHaveClass("pointer-events-none");
  });

  it("supports multiline sizing classes", () => {
    const { container } = render(
      <InputChrome multiline size="lg">
        <textarea aria-label="Description" />
      </InputChrome>,
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveClass("items-start");
    expect(shell).toHaveClass("rounded-2xl");
  });
});
