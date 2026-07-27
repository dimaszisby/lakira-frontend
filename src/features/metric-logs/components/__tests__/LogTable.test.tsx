import { render, screen } from "@testing-library/react";

import { LogTableBase } from "@/features/metric-logs/components/LogTable";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

const desktopSpy = jest.fn();
const mobileSpy = jest.fn();
const ISO_1 = "2026-02-10T10:00:00.000Z";

jest.mock("@/features/metric-logs/components/LogDesktopTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    desktopSpy(props);
    return <div data-testid="desktop-log-table" />;
  },
}));

jest.mock("@/features/metric-logs/components/LogMobileTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mobileSpy(props);
    return <div data-testid="mobile-log-table" />;
  },
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
];

describe("LogTable", () => {
  beforeEach(() => {
    desktopSpy.mockClear();
    mobileSpy.mockClear();
  });

  it("renders desktop and mobile table variants", () => {
    render(<LogTableBase logs={logs} sortBy="loggedAt" sortOrder="ASC" onSort={() => {}} />);

    expect(screen.getByTestId("desktop-log-table")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-log-table")).toBeInTheDocument();
  });

  it("passes shared data and sorting props to both variants", () => {
    const onSort = jest.fn();

    render(<LogTableBase logs={logs} sortBy="logValue" sortOrder="DESC" onSort={onSort} />);

    const desktopProps = desktopSpy.mock.calls[0]?.[0] as {
      logs: MetricLogVM[];
      sortBy: keyof MetricLogVM;
      sortOrder: "ASC" | "DESC" | null;
      onSort: (column: keyof MetricLogVM) => void;
    };
    const mobileProps = mobileSpy.mock.calls[0]?.[0] as typeof desktopProps;

    expect(desktopProps.logs).toEqual(logs);
    expect(desktopProps.sortBy).toBe("logValue");
    expect(desktopProps.sortOrder).toBe("DESC");
    expect(desktopProps.onSort).toBe(onSort);
    expect(mobileProps.logs).toEqual(logs);
    expect(mobileProps.onSort).toBe(onSort);
  });

  it("forwards row and action callbacks to both variants", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onRowClick = jest.fn();

    render(
      <LogTableBase
        logs={logs}
        sortBy="loggedAt"
        sortOrder="ASC"
        onSort={() => {}}
        onEdit={onEdit}
        onDelete={onDelete}
        onRowClick={onRowClick}
      />,
    );

    const desktopProps = desktopSpy.mock.calls[0]?.[0] as {
      onEdit?: (value: MetricLogVM) => void;
      onDelete?: (value: MetricLogVM) => void;
      onRowClick?: (value: MetricLogVM) => void;
    };
    const mobileProps = mobileSpy.mock.calls[0]?.[0] as typeof desktopProps;

    expect(desktopProps.onEdit).toBe(onEdit);
    expect(desktopProps.onDelete).toBe(onDelete);
    expect(desktopProps.onRowClick).toBe(onRowClick);
    expect(mobileProps.onEdit).toBe(onEdit);
    expect(mobileProps.onDelete).toBe(onDelete);
    expect(mobileProps.onRowClick).toBe(onRowClick);
  });
});
