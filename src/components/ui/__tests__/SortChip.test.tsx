import { fireEvent, render, screen } from "@testing-library/react";

import SortChip from "@/components/ui/SortChip";

describe("SortChip", () => {
  it("renders label with indicator when sorted", () => {
    const onClick = jest.fn();
    render(<SortChip label="Name" sortOrder="ASC" onClick={onClick} />);

    expect(screen.getByRole("button", { name: /name/i })).toHaveTextContent("▲");
    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders inactive styles and pressed state when not sorted", () => {
    render(<SortChip label="Updated" sortOrder={null} onClick={() => {}} />);

    const chip = screen.getByRole("button", { name: /updated/i });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip.className).toContain("text-ink-secondary");
    expect(chip).not.toHaveTextContent("▲");
  });

  it("renders custom children instead of label when provided", () => {
    render(
      <SortChip label="Hidden" sortOrder="DESC" onClick={() => {}} customChildren={<span>Custom</span>} />,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("disables interaction when disabled", () => {
    const onClick = jest.fn();
    render(<SortChip label="Name" sortOrder={null} onClick={onClick} disabled />);

    const chip = screen.getByRole("button", { name: /name not sorted/i });
    expect(chip).toBeDisabled();
    fireEvent.click(chip);
    expect(onClick).not.toHaveBeenCalled();
  });
});
