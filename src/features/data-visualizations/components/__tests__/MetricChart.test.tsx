import { render, screen } from "@testing-library/react";

import MetricChart from "@/features/data-visualizations/components/MetricChart";
import type { VizResponse } from "@/features/data-visualizations/types";

const lineSpy = jest.fn();
const BUCKET_1 = "2026-02-01T00:00:00.000Z";
const BUCKET_2 = "2026-02-02T00:00:00.000Z";
const ROOT_CLASS = "chart-root";
const EMPTY_CLASS = "chart-empty";

jest.mock("react-chartjs-2", () => ({
  __esModule: true,
  Line: (props: unknown) => {
    lineSpy(props);
    return <div data-testid="metric-chart-line" />;
  },
}));

const baseData: VizResponse = {
  series: [
    { bucketStartISO: BUCKET_1, value: 12 },
    { bucketStartISO: BUCKET_2, value: 20 },
  ],
  stats: {
    average: 16,
    min: 12,
    max: 20,
    count: 2,
  },
  meta: {
    metricId: "metric-1",
    unit: "kg",
    bucket: "1d",
    tz: "Asia/Jakarta",
    range: {
      startISO: "2026-02-01T00:00:00.000Z",
      endISO: "2026-02-03T00:00:00.000Z",
    },
  },
};

describe("MetricChart", () => {
  beforeEach(() => {
    lineSpy.mockClear();
  });

  it("renders empty state when all datapoints are missing", () => {
    render(
      <MetricChart
        className={EMPTY_CLASS}
        data={{
          ...baseData,
          series: [
            { bucketStartISO: BUCKET_1, value: null },
            { bucketStartISO: BUCKET_2, value: null },
          ],
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No data");
    expect(screen.getByRole("status")).toHaveClass(EMPTY_CLASS);
    expect(screen.queryByTestId("metric-chart-line")).not.toBeInTheDocument();
  });

  it("renders chart with metric dataset and expected options", () => {
    render(<MetricChart data={baseData} className={ROOT_CLASS} />);

    expect(screen.getByRole("img", { name: /metric chart for metric-1/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /metric chart for metric-1/i })).toHaveClass(ROOT_CLASS);
    expect(screen.getByTestId("metric-chart-line")).toBeInTheDocument();

    const props = lineSpy.mock.calls[0]?.[0] as {
      data: { datasets: Array<{ label: string; data: Array<{ x: string; y: number }> }> };
      options: {
        plugins: { legend: { display: boolean } };
        scales: { x: { time: { unit: string } } };
      };
    };

    expect(props.data.datasets).toHaveLength(1);
    expect(props.data.datasets[0]?.label).toBe("kg");
    expect(props.options.plugins.legend.display).toBe(false);
    expect(props.options.scales.x.time.unit).toBe("day");
  });

  it("adds goal dataset and enables legend when goal value is finite", () => {
    render(<MetricChart data={baseData} goalValue={18} />);

    const props = lineSpy.mock.calls[0]?.[0] as {
      data: { datasets: Array<{ label: string; data: Array<{ x: string; y: number }> }> };
      options: { plugins: { legend: { display: boolean } } };
    };

    expect(props.data.datasets).toHaveLength(2);
    expect(props.data.datasets[1]?.label).toBe("Goal");
    expect(props.data.datasets[1]?.data).toEqual([
      { x: BUCKET_1, y: 18 },
      { x: BUCKET_2, y: 18 },
    ]);
    expect(props.options.plugins.legend.display).toBe(true);
  });

  it("does not add goal dataset when goal value is not finite", () => {
    render(<MetricChart data={baseData} goalValue={Number.NaN} />);

    const props = lineSpy.mock.calls[0]?.[0] as {
      data: { datasets: unknown[] };
      options: { plugins: { legend: { display: boolean } } };
    };

    expect(props.data.datasets).toHaveLength(1);
    expect(props.options.plugins.legend.display).toBe(false);
  });

  it("formats tooltip label with unit and handles missing values", () => {
    render(<MetricChart data={baseData} />);

    const props = lineSpy.mock.calls[0]?.[0] as {
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx: { raw: { y: number } | number | null }) => string;
            };
          };
        };
      };
    };

    const label = props.options.plugins.tooltip.callbacks.label;
    expect(label({ raw: { y: 10 } })).toBe("10 kg");
    expect(label({ raw: null })).toBe("No data");
    expect(label({ raw: Number.NaN })).toBe("No data");
  });

  it("falls back to default dataset label and trims unitless tooltip output", () => {
    render(<MetricChart data={{ ...baseData, meta: { ...baseData.meta, unit: "   " } }} />);

    const props = lineSpy.mock.calls[0]?.[0] as {
      data: { datasets: Array<{ label: string }> };
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx: { raw: { y: number } | number | null }) => string;
            };
          };
        };
      };
    };

    expect(props.data.datasets[0]?.label).toBe("Value");

    const label = props.options.plugins.tooltip.callbacks.label;
    expect(label({ raw: { y: 8 } })).toBe("8");
  });
});
