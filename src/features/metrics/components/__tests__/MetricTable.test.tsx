import { render, screen } from "@testing-library/react";

import { MetricTableBase } from "@/features/metrics/components/MetricTable";
import type { MetricPreviewVM } from "@/features/metrics/view-models";

const desktopSpy = jest.fn();
const mobileSpy = jest.fn();

jest.mock("@/features/metrics/components/MetricDesktopTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    desktopSpy(props);
    return <div data-testid="desktop-metric-table" />;
  },
}));

jest.mock("@/features/metrics/components/MetricMobileTable", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mobileSpy(props);
    return <div data-testid="mobile-metric-table" />;
  },
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
];

describe("MetricTable", () => {
  beforeEach(() => {
    desktopSpy.mockClear();
    mobileSpy.mockClear();
  });

  it("renders desktop and mobile variants in 'both' mode", () => {
    render(<MetricTableBase metrics={metrics} sortBy="name" sortOrder="ASC" onSort={() => {}} />);

    expect(screen.getByTestId("desktop-metric-table")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-metric-table")).toBeInTheDocument();
  });

  it("passes shared sorting and callbacks to both variants", () => {
    const onSort = jest.fn();
    const onRowClick = jest.fn();

    render(
      <MetricTableBase
        metrics={metrics}
        sortBy="logCount"
        sortOrder="DESC"
        onSort={onSort}
        onRowClick={onRowClick}
      />,
    );

    const desktopProps = desktopSpy.mock.calls[0]?.[0] as {
      metrics: MetricPreviewVM[];
      sortBy: keyof MetricPreviewVM;
      sortOrder: "ASC" | "DESC" | null;
      onSort: (column: keyof MetricPreviewVM) => void;
      onRowClick?: (value: MetricPreviewVM) => void;
    };
    const mobileProps = mobileSpy.mock.calls[0]?.[0] as typeof desktopProps;

    expect(desktopProps.metrics).toEqual(metrics);
    expect(desktopProps.sortBy).toBe("logCount");
    expect(desktopProps.sortOrder).toBe("DESC");
    expect(desktopProps.onSort).toBe(onSort);
    expect(desktopProps.onRowClick).toBe(onRowClick);
    expect(mobileProps.onSort).toBe(onSort);
    expect(mobileProps.onRowClick).toBe(onRowClick);
  });

  it("renders only requested variant mode", () => {
    render(
      <MetricTableBase
        metrics={metrics}
        sortBy="name"
        sortOrder="ASC"
        onSort={() => {}}
        variant="desktop"
      />,
    );

    expect(screen.getByTestId("desktop-metric-table")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-metric-table")).not.toBeInTheDocument();
  });
});
