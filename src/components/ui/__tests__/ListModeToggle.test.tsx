import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ListModeToggle } from "@/components/ui/ListModeToggle";

const INFINITE = "Infinite";

describe("ListModeToggle", () => {
  it("renders a labelled radio group named by the visible labels", () => {
    render(<ListModeToggle value="pages" onChange={() => {}} />);

    expect(
      screen.getByRole("radiogroup", { name: /switch list display mode/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Paginated" })).toBeChecked();
    expect(screen.getByRole("radio", { name: INFINITE })).not.toBeChecked();
  });

  it("keeps the longer description as a tooltip on the segment", () => {
    render(<ListModeToggle value="pages" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: INFINITE }).closest("label")).toHaveAttribute(
      "title",
      "Card list with infinite loading",
    );
  });

  it("emits the new mode when a different option is chosen", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ListModeToggle value="pages" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: INFINITE }));

    expect(onChange).toHaveBeenCalledWith("scroll");
  });

  it("does not emit when the active option is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ListModeToggle value="scroll" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: INFINITE }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("changes mode with the arrow keys", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ListModeToggle value="pages" onChange={onChange} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("scroll");
  });

  it("has no axe violations", async () => {
    const { container } = render(<ListModeToggle value="pages" onChange={() => {}} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
