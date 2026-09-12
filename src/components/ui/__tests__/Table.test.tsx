import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import type { TableColumn } from "@/components/ui/Table";
import { Table } from "@/components/ui/Table";

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

const firstRow = () => document.querySelector<HTMLTableRowElement>('tr[data-rowid="r1"]');

describe("Table", () => {
  it("renders sortable headers and emits sort changes", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(
      <Table<Row>
        data={rows}
        columns={columns}
        sortBy="name"
        sortOrder="ASC"
        onSort={onSort}
        rowKey={(row) => row.id}
      />,
    );

    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await user.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("handles row click and keyboard activation", () => {
    const onRowClick = jest.fn();

    render(
      <Table<Row> data={rows} columns={columns} rowKey={(row) => row.id} onRowClick={onRowClick} />,
    );

    const row = firstRow();
    expect(row).not.toBeNull();
    if (!row) return;

    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });

    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("does not trigger row click from interactive cell controls", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();

    render(
      <Table<Row> data={rows} columns={columns} rowKey={(row) => row.id} onRowClick={onRowClick} />,
    );

    await user.click(screen.getByRole("button", { name: "2" }));
    screen.getByRole("button", { name: "2" }).focus();
    await user.keyboard("{Enter}");

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("does not trigger row hover from interactive cell focus", () => {
    const onRowHover = jest.fn();

    render(
      <Table<Row>
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        onRowClick={() => {}}
        onRowHover={onRowHover}
      />,
    );

    const row = firstRow();
    expect(row).not.toBeNull();
    if (!row) return;

    fireEvent.focus(row);
    expect(onRowHover).toHaveBeenCalledWith(rows[0]);

    onRowHover.mockClear();
    fireEvent.focus(screen.getByRole("button", { name: "2" }));
    expect(onRowHover).not.toHaveBeenCalled();
  });

  it("renders the empty message when there is no data", () => {
    render(
      <Table<Row>
        data={[]}
        columns={columns}
        rowKey={(row) => row.id}
        emptyMessage="Nothing here yet"
      />,
    );

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("labels the table", () => {
    render(
      <Table<Row> data={rows} columns={columns} rowKey={(row) => row.id} aria-label="Metrics" />,
    );

    expect(screen.getByRole("table", { name: "Metrics" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Table<Row>
        data={rows}
        columns={columns}
        sortBy="name"
        sortOrder="DESC"
        onSort={() => {}}
        rowKey={(row) => row.id}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
