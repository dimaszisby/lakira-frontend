import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricCategoryDesktopTableBase } from "@/features/metric-categories/components/MetricCategoryDesktopTable";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";

const categories: MetricCategoryVM[] = [
  {
    id: "cat-1",
    name: "Wellness",
    color: "#FF0000",
    icon: "🔥",
    metricCount: 5,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-11T12:00:00.000Z",
  },
  {
    id: "cat-2",
    name: "Hydration",
    color: "#00FF00",
    icon: "💧",
    metricCount: 2,
    createdAt: "invalid-date",
    updatedAt: undefined,
  },
];

describe("MetricCategoryDesktopTable", () => {
  it("renders sortable headers and emits onSort", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(
      <MetricCategoryDesktopTableBase
        categories={categories}
        sortBy="name"
        sortOrder="ASC"
        onSort={onSort}
      />,
    );

    await user.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("renders color cells with accessible text and handles row click", () => {
    const onRowClick = jest.fn();

    render(
      <MetricCategoryDesktopTableBase
        categories={categories}
        sortBy="createdAt"
        sortOrder="DESC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    expect(screen.getByText(/color #ff0000/i)).toBeInTheDocument();

    const firstRow = document.querySelector<HTMLTableRowElement>('tr[data-rowid="cat-1"]');
    expect(firstRow).not.toBeNull();
    if (!firstRow) return;

    fireEvent.click(firstRow);
    expect(onRowClick).toHaveBeenCalledWith(categories[0]);
  });

  it("shows fallback values and empty message", () => {
    const { rerender } = render(
      <MetricCategoryDesktopTableBase
        categories={categories}
        sortBy="updatedAt"
        sortOrder={null}
        onSort={() => {}}
      />,
    );

    const naCells = screen.getAllByText("N/A");
    expect(naCells.length).toBeGreaterThanOrEqual(2);

    rerender(
      <MetricCategoryDesktopTableBase
        categories={[]}
        sortBy="updatedAt"
        sortOrder={null}
        onSort={() => {}}
      />,
    );

    expect(screen.getByText("No categories available")).toBeInTheDocument();
  });
});
