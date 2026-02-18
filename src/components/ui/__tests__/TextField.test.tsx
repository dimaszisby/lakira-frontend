import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import TextField from "@/components/ui/TextField";

describe("TextField", () => {
  it("calls registration and external onChange handlers", async () => {
    const user = userEvent.setup();
    const onRegistrationChange = jest.fn();
    const onChange = jest.fn();

    render(
      <TextField
        aria-label="Metric name"
        registration={{
          name: "metricName",
          onBlur: jest.fn(),
          ref: jest.fn(),
          onChange: onRegistrationChange,
        }}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /metric name/i }), "AB");

    expect(onRegistrationChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("supports clearable behavior for controlled value", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [value, setValue] = useState("Hello");
      return (
        <TextField
          aria-label="Search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          clearable
        />
      );
    };

    render(<Harness />);

    const input = screen.getByRole("textbox", { name: /search/i });
    expect(input).toHaveValue("Hello");

    await user.click(screen.getByRole("button", { name: /clear input/i }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("toggles password visibility when revealToggle is enabled", async () => {
    const user = userEvent.setup();

    render(<TextField aria-label="Password" type="password" revealToggle defaultValue="secret" />);

    const input = screen.getByDisplayValue("secret");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
