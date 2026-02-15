import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { TableColumn } from "@/components/ui/Table";
import { TableBase } from "@/components/ui/Table";

type Row = {
  id: string;
  name: string;
  count: number;
};

const columns: TableColumn<Row>[] = [
  { key: "name", label: "Name", sortable: true },
  {
    key: "count",
    label: "Count",
    align: "right",
    renderCell: (row) => <button type="button">{row.count}</button>,
  },
];

const rows: Row[] = [
  { id: "r1", name: "Alpha", count: 2 },
  { id: "r2", name: "Beta", count: 4 },
];

describe("Table", () => {
  it("renders sortable headers and emits sort changes", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(
      <TableBase<Row>
        data={rows}
        columns={columns}
        sortBy="name"
        sortOrder="ASC"
        onSort={onSort}
        rowKey={(row) => row.id}
      />,
    );

    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("handles row click and keyboard activation", () => {
    const onRowClick = jest.fn();

    render(
      <TableBase<Row>
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={onRowClick}
      />,
    );

    const firstRow = document.querySelector<HTMLTableRowElement>('tr[data-rowid="r1"]');
    expect(firstRow).not.toBeNull();
    if (!firstRow) return;

    fireEvent.click(firstRow);
    fireEvent.keyDown(firstRow, { key: "Enter" });
    fireEvent.keyDown(firstRow, { key: " " });

    expect(onRowClick).toHaveBeenNthCalledWith(1, rows[0]);
    expect(onRowClick).toHaveBeenNthCalledWith(2, rows[0]);
    expect(onRowClick).toHaveBeenNthCalledWith(3, rows[0]);
  });

  it("does not trigger row click from interactive cell controls", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();

    render(
      <TableBase<Row>
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("renders empty state message when no data is available", () => {
    render(
      <TableBase<Row>
        data={[]}
        columns={columns}
        rowKey={(row) => row.id}
        emptyMessage="Nothing here yet"
      />,
    );

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });
});
