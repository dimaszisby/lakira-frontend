import { fireEvent, render, screen } from "@testing-library/react";

import SortChipGroup from "@/components/ui/SortChipGroup";

type Column = { name: string; createdAt: string };

const columns = [
  { key: "name", label: "Name", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
] satisfies Parameters<typeof SortChipGroup<Column>>[0]["columns"];

describe("SortChipGroup", () => {
  it("renders sort group and chips with aria-sort metadata", () => {
    const noop = () => {};
    render(
      <SortChipGroup<Column>
        columns={columns}
        sortBy="name"
        sortOrder="ASC"
        onSort={noop}
        className="custom-class"
      />,
    );

    expect(screen.getByRole("group", { name: /sort options/i })).toBeInTheDocument();
    const wrappers = screen.getAllByRole("button");
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0].parentElement).toHaveAttribute("aria-sort", "ascending");
    expect(wrappers[1].parentElement).not.toHaveAttribute("aria-sort");
  });

  it("invokes onSort with target column", () => {
    const onSort = jest.fn();
    render(
      <SortChipGroup<Column> columns={columns} sortBy="name" sortOrder="ASC" onSort={onSort} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /created/i }));
    expect(onSort).toHaveBeenCalledWith("createdAt");
  });

  it("does not render unsortable columns", () => {
    const mixedColumns = [
      ...columns,
      { key: "nonSortable", label: "NoSort", sortable: false },
    ] as unknown as Parameters<typeof SortChipGroup<Column>>[0]["columns"];

    render(
      <SortChipGroup<Column> columns={mixedColumns} sortBy="name" sortOrder="ASC" onSort={() => {}} />,
    );

    expect(screen.queryByRole("button", { name: /nosort/i })).not.toBeInTheDocument();
  });
});
