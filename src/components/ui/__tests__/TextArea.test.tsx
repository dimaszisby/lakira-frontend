import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TextArea from "@/components/ui/TextArea";

describe("TextArea", () => {
  it("shows and updates character counter when enabled", async () => {
    const user = userEvent.setup();

    render(<TextArea aria-label="Description" maxLength={10} showCount />);

    const input = screen.getByRole("textbox", { name: /description/i });
    expect(screen.getByText("0/10")).toBeInTheDocument();

    await user.type(input, "abcd");

    expect(screen.getByText("4/10")).toBeInTheDocument();
  });

  it("calls registration and external onChange handlers", async () => {
    const user = userEvent.setup();
    const onRegistrationChange = jest.fn();
    const onChange = jest.fn();

    render(
      <TextArea
        aria-label="Notes"
        registration={{
          name: "notes",
          onBlur: jest.fn(),
          ref: jest.fn(),
          onChange: onRegistrationChange,
        }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /notes/i }), "x");

    expect(onRegistrationChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("renders optional addons", () => {
    render(
      <TextArea
        aria-label="Body"
        leftAddon={<span data-testid="left-addon">L</span>}
        rightAddon={<span data-testid="right-addon">R</span>}
      />,
    );

    expect(screen.getByTestId("left-addon")).toBeInTheDocument();
    expect(screen.getByTestId("right-addon")).toBeInTheDocument();
  });
});
