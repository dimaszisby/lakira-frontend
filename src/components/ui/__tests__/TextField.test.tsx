import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/ui/TextField";

const ARIA_INVALID = "aria-invalid";
const CLEAR_BUTTON = /clear input/i;

const registerLike = (name: string) => ({
  name,
  onChange: jest.fn(),
  onBlur: jest.fn(),
  ref: jest.fn(),
});

describe("TextField", () => {
  it("forwards react-hook-form register props spread onto it", async () => {
    const user = userEvent.setup();
    const field = registerLike("metricName");

    render(<TextField aria-label="Metric name" {...field} />);

    const input = screen.getByRole("textbox", { name: /metric name/i });
    await user.type(input, "AB");
    await user.tab();

    expect(input).toHaveAttribute("name", "metricName");
    expect(field.ref).toHaveBeenCalledWith(input);
    expect(field.onChange).toHaveBeenCalled();
    expect(field.onBlur).toHaveBeenCalled();
  });

  it("clears a controlled value and keeps focus", async () => {
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
    expect(screen.queryByRole("button", { name: /clear input/i })).not.toBeInTheDocument();
  });

  it("clears an uncontrolled value and notifies register handlers", async () => {
    const user = userEvent.setup();
    const field = registerLike("search");

    render(<TextField aria-label="Search" defaultValue="Hello" clearable {...field} />);

    const input = screen.getByRole("textbox", { name: /search/i });
    await user.click(screen.getByRole("button", { name: /clear input/i }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(field.onChange).toHaveBeenCalled();
  });

  it("shows the clear button when react-hook-form fills a default value", () => {
    const Harness = () => {
      const { register } = useForm({ defaultValues: { icon: "Folder" } });
      return <TextField aria-label="Icon" clearable {...register("icon")} />;
    };

    render(<Harness />);

    expect(screen.getByRole("textbox", { name: /icon/i })).toHaveValue("Folder");
    expect(screen.getByRole("button", { name: CLEAR_BUTTON })).toBeInTheDocument();
  });

  it("hides the clear button when react-hook-form resets the value to empty", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const {
        register,
        reset,
        formState: { isDirty },
      } = useForm({ defaultValues: { icon: "Folder" } });

      return (
        <>
          <TextField aria-label="Icon" clearable {...register("icon")} />
          <button type="button" onClick={() => reset({ icon: "" }, { keepDefaultValues: true })}>
            Reset {isDirty ? "(dirty)" : ""}
          </button>
        </>
      );
    };

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByRole("textbox", { name: /icon/i })).toHaveValue("");
    expect(screen.queryByRole("button", { name: CLEAR_BUTTON })).not.toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(<TextField aria-label="Password" type="password" defaultValue="secret" />);

    const input = screen.getByDisplayValue("secret");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("disables the utility buttons when the field is disabled", () => {
    render(
      <TextField aria-label="Password" type="password" defaultValue="secret" clearable disabled />,
    );

    expect(screen.getByRole("button", { name: /clear input/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /show password/i })).toBeDisabled();
  });

  it("marks the input invalid from the invalid prop or an injected aria-invalid", () => {
    const { rerender } = render(<TextField aria-label="Email" invalid />);
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveAttribute(ARIA_INVALID, "true");

    rerender(<TextField aria-label="Email" aria-invalid />);
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveAttribute(ARIA_INVALID, "true");

    rerender(<TextField aria-label="Email" />);
    expect(screen.getByRole("textbox", { name: /email/i })).not.toHaveAttribute(ARIA_INVALID);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TextField aria-label="Password" type="password" defaultValue="secret" clearable invalid />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
