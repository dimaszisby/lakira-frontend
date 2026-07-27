import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LogMobileTableBase } from "@/features/metric-logs/components/LogMobileTable";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

const ISO_1 = "2026-02-10T10:00:00.000Z";
const ISO_2 = "2026-02-11T10:00:00.000Z";

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

jest.mock("@/features/metric-logs/components/LogMobileCard", () => ({
  __esModule: true,
  default: ({ log, onClick }: { log: MetricLogVM; onClick?: (value: MetricLogVM) => void }) => (
    <button type="button" onClick={() => onClick?.(log)}>
      {log.logValue}
    </button>
  ),
}));

const logs: MetricLogVM[] = [
  {
    id: "log-1",
    metricId: "metric-1",
    logValue: 120,
    loggedAt: ISO_1,
    type: "manual",
    createdAt: ISO_1,
    updatedAt: ISO_1,
  },
  {
    id: "log-2",
    metricId: "metric-1",
    logValue: 80,
    loggedAt: ISO_2,
    type: "manual",
    createdAt: ISO_2,
    updatedAt: ISO_2,
  },
];

describe("LogMobileTable", () => {
  it("renders empty state when no logs are available", () => {
    render(<LogMobileTableBase logs={[]} sortBy="loggedAt" sortOrder="ASC" onSort={() => {}} />);

    expect(screen.getByRole("status")).toHaveTextContent("No logs available");
  });

  it("renders logs and emits row click callback", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();

    render(
      <LogMobileTableBase
        logs={logs}
        sortBy="loggedAt"
        sortOrder="ASC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "120" }));

    expect(onRowClick).toHaveBeenCalledWith(logs[0]);
    expect(screen.getAllByTestId("swipeable-card")).toHaveLength(2);
  });

  it("emits edit and delete callbacks for selected log", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <LogMobileTableBase
        logs={logs}
        sortBy="loggedAt"
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

    expect(onEdit).toHaveBeenCalledWith(logs[0]);
    expect(onDelete).toHaveBeenCalledWith(logs[0]);
  });
});
