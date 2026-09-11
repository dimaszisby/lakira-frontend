import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import type { SortChipColumn } from "@/components/ui/SortChipGroup";
import { SortChipGroup } from "@/components/ui/SortChipGroup";

type Row = { name: string; createdAt: string; notes: string };

const columns: SortChipColumn<Row>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
  { key: "notes", label: "Notes", sortable: false },
];

describe("SortChipGroup", () => {
  it("renders a labelled group with one chip per sortable column", () => {
    render(
      <SortChipGroup<Row>
        columns={columns}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        className="custom-class"
      />,
    );

    const group = screen.getByRole("group", { name: /sort options/i });
    expect(group).toHaveClass("custom-class");
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /notes/i })).not.toBeInTheDocument();
  });

  it("marks only the sorted column as pressed", () => {
    render(
      <SortChipGroup<Row> columns={columns} sortBy="name" sortOrder="ASC" onSort={() => {}} />,
    );

    expect(screen.getByRole("button", { name: /sort by name/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /sort by created/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onSort with the target column", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(<SortChipGroup<Row> columns={columns} sortBy="name" sortOrder="ASC" onSort={onSort} />);

    await user.click(screen.getByRole("button", { name: /sort by created/i }));
    expect(onSort).toHaveBeenCalledWith("createdAt");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <SortChipGroup<Row> columns={columns} sortBy="name" sortOrder="DESC" onSort={() => {}} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
