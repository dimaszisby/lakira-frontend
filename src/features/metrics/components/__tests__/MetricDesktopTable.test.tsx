import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricDesktopTableBase } from "@/features/metrics/components/MetricDesktopTable";
import type { MetricPreviewVM } from "@/features/metrics/view-models";

const metrics: MetricPreviewVM[] = [
  {
    id: "metric-1",
    name: "Sleep Quality",
    defaultUnit: "hrs",
    description: "Track sleep",
    isPublic: true,
    category: {
      id: "cat-1",
      name: "Wellness",
      color: "#FF0000",
      icon: "🔥",
      metricCount: 5,
    },
    goalType: null,
    logCount: 42,
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-11T10:00:00.000Z",
  },
  {
    id: "metric-2",
    name: "Hydration",
    defaultUnit: "ml",
    description: null,
    isPublic: false,
    category: null,
    goalType: null,
    logCount: 10,
    createdAt: "2026-02-09T10:00:00.000Z",
    updatedAt: "2026-02-10T10:00:00.000Z",
  },
];

describe("MetricDesktopTable", () => {
  it("renders sortable headers and emits onSort", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(
      <MetricDesktopTableBase
        metrics={metrics}
        sortBy="name"
        sortOrder="ASC"
        onSort={onSort}
      />,
    );

    await user.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("handles row click and renders description fallback", () => {
    const onRowClick = jest.fn();

    render(
      <MetricDesktopTableBase
        metrics={metrics}
        sortBy="createdAt"
        sortOrder="DESC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    expect(screen.getByText("No Description")).toBeInTheDocument();

    const firstRow = document.querySelector<HTMLTableRowElement>('tr[data-rowid="metric-1"]');
    expect(firstRow).not.toBeNull();
    if (!firstRow) return;

    fireEvent.click(firstRow);
    expect(onRowClick).toHaveBeenCalledWith(metrics[0]);
  });

  it("shows empty message when metrics are empty", () => {
    render(
      <MetricDesktopTableBase metrics={[]} sortBy="createdAt" sortOrder={null} onSort={() => {}} />,
    );

    expect(screen.getByText("No metrics available")).toBeInTheDocument();
  });
});
