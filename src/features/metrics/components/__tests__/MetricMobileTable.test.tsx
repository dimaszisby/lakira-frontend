import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MetricMobileTableBase } from "@/features/metrics/components/MetricMobileTable";
import type { MetricPreviewVM } from "@/features/metrics/view-models";

jest.mock("@/ui/SwipeableCard", () => ({
  __esModule: true,
  default: ({
    actions,
    children,
  }: {
    actions: { label: string; onClick: () => void }[];
    children: React.ReactNode;
  }) => (
    <div data-testid="swipeable-card">
      {actions.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
      {children}
    </div>
  ),
}));

jest.mock("@/features/metrics/components/MetricLibraryMobileCard", () => ({
  __esModule: true,
  default: ({
    metric,
    onClick,
  }: {
    metric: MetricPreviewVM;
    onClick?: (value: MetricPreviewVM) => void;
  }) => (
    <button type="button" onClick={() => onClick?.(metric)}>
      {metric.name}
    </button>
  ),
}));

const metrics: MetricPreviewVM[] = [
  {
    id: "metric-1",
    name: "Sleep Quality",
    defaultUnit: "hrs",
    description: "Track sleep",
    isPublic: true,
    category: null,
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

describe("MetricMobileTable", () => {
  it("renders empty state when there are no metrics", () => {
    render(<MetricMobileTableBase metrics={[]} sortBy="name" sortOrder="ASC" onSort={() => {}} />);

    expect(screen.getByRole("status")).toHaveTextContent("No metrics available");
  });

  it("renders metrics and emits row click callback", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();

    render(
      <MetricMobileTableBase
        metrics={metrics}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sleep Quality" }));

    expect(onRowClick).toHaveBeenCalledWith(metrics[0]);
    expect(screen.getAllByTestId("swipeable-card")).toHaveLength(2);
  });

  it("emits edit and delete callbacks for selected metric", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <MetricMobileTableBase
        metrics={metrics}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

    await user.click(editButtons[0] as HTMLButtonElement);
    await user.click(deleteButtons[0] as HTMLButtonElement);

    expect(onEdit).toHaveBeenCalledWith(metrics[0]);
    expect(onDelete).toHaveBeenCalledWith(metrics[0]);
  });
});
