import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ListModeToggle from "@/components/ui/ListModeToggle";

describe("ListModeToggle", () => {
  it("renders as a radiogroup with the active option selected", () => {
    render(<ListModeToggle value="pages" onChange={() => {}} />);

    expect(screen.getByRole("radiogroup", { name: /switch list display mode/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /page-by-page table view/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /card list with infinite loading/i })).not.toBeChecked();
  });

  it("calls onChange when selecting a different option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ListModeToggle value="pages" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /card list with infinite loading/i }));

    expect(onChange).toHaveBeenCalledWith("scroll");
  });

  it("does not call onChange when clicking the active option", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ListModeToggle value="scroll" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /card list with infinite loading/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("supports arrow-key selection changes", () => {
    const onChange = jest.fn();

    render(<ListModeToggle value="pages" onChange={onChange} />);

    fireEvent.keyDown(screen.getByRole("radio", { name: /page-by-page table view/i }), {
      key: "ArrowRight",
    });

    expect(onChange).toHaveBeenCalledWith("scroll");
  });
});
