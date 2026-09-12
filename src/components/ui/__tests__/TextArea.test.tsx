import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useForm } from "react-hook-form";

import { TextArea } from "@/components/ui/TextArea";

describe("TextArea", () => {
  it("counts a default value filled by react-hook-form", () => {
    const Harness = () => {
      const { register } = useForm({ defaultValues: { description: "hello" } });
      return (
        <TextArea aria-label="Description" maxLength={20} showCount {...register("description")} />
      );
    };

    render(<Harness />);

    expect(screen.getByText("5/20")).toBeInTheDocument();
  });

  it("recounts when react-hook-form resets the value", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const {
        register,
        reset,
        formState: { isDirty },
      } = useForm({ defaultValues: { description: "" } });

      return (
        <>
          <TextArea
            aria-label="Description"
            maxLength={20}
            showCount
            {...register("description")}
          />
          <button
            type="button"
            onClick={() => reset({ description: "loaded" }, { keepDefaultValues: true })}
          >
            Load {isDirty ? "(dirty)" : ""}
          </button>
        </>
      );
    };

    render(<Harness />);
    expect(screen.getByText("0/20")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /load/i }));

    expect(screen.getByText("6/20")).toBeInTheDocument();
  });

  it("shows and updates the character counter when enabled", async () => {
    const user = userEvent.setup();

    render(<TextArea aria-label="Description" maxLength={10} showCount />);

    expect(screen.getByText("0/10")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: /description/i }), "abcd");

    expect(screen.getByText("4/10")).toBeInTheDocument();
  });

  it("derives the counter from a controlled value", () => {
    render(
      <TextArea aria-label="Notes" value="hello" onChange={() => {}} maxLength={20} showCount />,
    );

    expect(screen.getByText("5/20")).toBeInTheDocument();
  });

  it("forwards react-hook-form register props spread onto it", async () => {
    const user = userEvent.setup();
    const field = { name: "notes", onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() };

    render(<TextArea aria-label="Notes" {...field} />);

    const textarea = screen.getByRole("textbox", { name: /notes/i });
    await user.type(textarea, "x");

    expect(textarea).toHaveAttribute("name", "notes");
    expect(field.ref).toHaveBeenCalledWith(textarea);
    expect(field.onChange).toHaveBeenCalled();
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

  it("marks the textarea invalid", () => {
    render(<TextArea aria-label="Body" invalid />);

    expect(screen.getByRole("textbox", { name: /body/i })).toHaveAttribute("aria-invalid", "true");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TextArea aria-label="Description" maxLength={10} showCount invalid />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
