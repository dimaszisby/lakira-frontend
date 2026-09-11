import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { SortChip } from "@/components/ui/SortChip";

describe("SortChip", () => {
  it("announces the sort direction and emits clicks when sorted", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<SortChip label="Name" sortOrder="ASC" onClick={onClick} />);

    const chip = screen.getByRole("button", { name: "Name sorted ascending" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await user.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is unpressed without a direction icon when not sorted", () => {
    render(<SortChip label="Updated" sortOrder={null} onClick={() => {}} />);

    const chip = screen.getByRole("button", { name: "Updated not sorted" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip).toHaveAttribute("data-state", "inactive");
    expect(chip.querySelector("svg")).toBeNull();
  });

  it("renders children instead of the default label", () => {
    render(
      <SortChip label="Hidden" sortOrder="DESC" onClick={() => {}}>
        <span>Custom</span>
      </SortChip>,
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("prefers an explicit aria-label", () => {
    render(<SortChip label="Name" sortOrder="DESC" onClick={() => {}} aria-label="Sort by Name" />);

    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
  });

  it("does not emit clicks when disabled", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<SortChip label="Name" sortOrder={null} onClick={onClick} disabled />);

    const chip = screen.getByRole("button", { name: /name not sorted/i });
    expect(chip).toBeDisabled();
    await user.click(chip);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SortChip label="Name" sortOrder="ASC" onClick={() => {}} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
