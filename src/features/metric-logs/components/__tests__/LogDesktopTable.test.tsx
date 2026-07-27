import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LogDesktopTableBase } from "@/features/metric-logs/components/LogDesktopTable";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

const ISO_1 = "2026-02-10T10:00:00.000Z";
const ISO_2 = "2026-02-11T10:00:00.000Z";

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
    loggedAt: "invalid-date",
    type: "manual",
    createdAt: ISO_2,
    updatedAt: ISO_2,
  },
];

describe("LogDesktopTable", () => {
  it("renders sortable headers and emits onSort", async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    render(<LogDesktopTableBase logs={logs} sortBy="loggedAt" sortOrder="ASC" onSort={onSort} />);

    await user.click(screen.getByRole("button", { name: /sort by logged at/i }));

    expect(onSort).toHaveBeenCalledWith("loggedAt");
  });

  it("renders fallback date value and handles row click", () => {
    const onRowClick = jest.fn();

    render(
      <LogDesktopTableBase
        logs={logs}
        sortBy="logValue"
        sortOrder="DESC"
        onSort={() => {}}
        onRowClick={onRowClick}
      />,
    );

    expect(screen.getByText("N/A")).toBeInTheDocument();

    const firstRow = document.querySelector<HTMLTableRowElement>('tr[data-rowid="log-1"]');
    expect(firstRow).not.toBeNull();
    if (!firstRow) return;

    fireEvent.click(firstRow);
    expect(onRowClick).toHaveBeenCalledWith(logs[0]);
  });

  it("shows empty message when logs are empty", () => {
    render(<LogDesktopTableBase logs={[]} sortBy="loggedAt" sortOrder={null} onSort={() => {}} />);

    expect(screen.getByText("No logs available")).toBeInTheDocument();
  });
});
