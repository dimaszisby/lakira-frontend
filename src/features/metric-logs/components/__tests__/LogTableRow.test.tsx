import { fireEvent, render, screen } from "@testing-library/react";

import LogTableRow from "@/features/metric-logs/components/LogTableRow";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { formatHuman } from "@/utils/date-io";

jest.mock("@/utils/date-io", () => ({
  formatHuman: jest.fn(() => "Formatted date"),
}));

const mockedFormatHuman = formatHuman as jest.MockedFunction<typeof formatHuman>;
const ISO_TIMESTAMP = "2026-01-10T02:30:00.000Z";

const baseLog: MetricLogVM = {
  id: "log-1",
  metricId: "metric-1",
  logValue: 42,
  loggedAt: ISO_TIMESTAMP,
  type: "manual",
  createdAt: ISO_TIMESTAMP,
  updatedAt: ISO_TIMESTAMP,
};

function renderRow(log: MetricLogVM, onClick?: (entry: MetricLogVM) => void) {
  return render(
    <table>
      <tbody>
        <LogTableRow log={log} onClick={onClick} />
      </tbody>
    </table>,
  );
}

describe("LogTableRow", () => {
  beforeEach(() => {
    mockedFormatHuman.mockClear();
  });

  it("renders formatted date/value and row metadata", () => {
    renderRow(baseLog);

    expect(mockedFormatHuman).toHaveBeenCalledWith(baseLog.loggedAt);
    expect(screen.getByText("Formatted date")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByTestId("metric-row-log-1")).toHaveAttribute(
      "aria-label",
      `View details for ${baseLog.loggedAt}`,
    );
  });

  it("emits click callback for pointer and keyboard activation", () => {
    const onClick = jest.fn();

    renderRow(baseLog, onClick);

    const row = screen.getByTestId("metric-row-log-1");
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });

    expect(onClick).toHaveBeenCalledTimes(3);
    expect(onClick).toHaveBeenNthCalledWith(1, baseLog);
    expect(onClick).toHaveBeenNthCalledWith(2, baseLog);
    expect(onClick).toHaveBeenNthCalledWith(3, baseLog);
  });

  it("renders fallback label when runtime logValue is missing", () => {
    const missingValueLog = {
      ...baseLog,
      id: "log-2",
      logValue: null as unknown as number,
    };

    renderRow(missingValueLog);

    expect(screen.getByText("No Description")).toBeInTheDocument();
  });
});
