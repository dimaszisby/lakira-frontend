import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Visualization from "@/components/ui/Visualization";

const mockUseMetricVisualization = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();
const GRANULARITY_PICKER_TEST_ID = "granularity-picker";
const TIME_RANGE_PICKER_REL_TEST_ID = "time-range-picker-rel";
const ABSOLUTE_RANGE_SEARCH =
  "view-bucket=1m&view-start=2026-01-01T00:00:00.000Z&view-end=2026-01-10T00:00:00.000Z";
const DEFAULT_GRANULARITY_LABEL = "granularity-1d";
const DEFAULT_RELATIVE_RANGE_LABEL = "range-relative-30d";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/features/data-visualizations/hooks", () => ({
  useMetricVisualization: (...args: unknown[]) => mockUseMetricVisualization(...args),
}));

jest.mock("@/features/data-visualizations/components/GranularityPicker", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <div>
      <button
        data-testid={GRANULARITY_PICKER_TEST_ID}
        type="button"
        onClick={() => onChange("1w")}
      >
        granularity-{value}
      </button>
      <button
        data-testid="granularity-picker-invalid"
        type="button"
        onClick={() => onChange("7d")}
      >
        invalid-bucket
      </button>
    </div>
  ),
}));

jest.mock("@/features/data-visualizations/components/TimeRangePicker", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: { mode: "relative"; last: string } | { mode: "absolute"; start: string; end: string };
    onChange: (next: unknown) => void;
  }) => (
    <div>
      <button
        data-testid={TIME_RANGE_PICKER_REL_TEST_ID}
        type="button"
        onClick={() =>
          onChange({
            mode: "relative",
            last: "90d",
          })
        }
      >
        range-{value.mode === "relative" ? `relative-${value.last}` : "absolute"}
      </button>
      <button
        data-testid="time-range-picker-abs"
        type="button"
        onClick={() =>
          onChange({
            mode: "absolute",
            start: "2026-02-01T00:00:00.000Z",
            end: "2026-02-10T00:00:00.000Z",
          })
        }
      >
        set-absolute
      </button>
    </div>
  ),
}));

jest.mock("@/features/data-visualizations/components/MetricChart", () => ({
  __esModule: true,
  default: ({ data, goalValue }: { data: unknown; goalValue: number | null }) => (
    <div data-testid="metric-chart">{JSON.stringify({ data, goalValue })}</div>
  ),
}));

describe("Visualization", () => {
  beforeEach(() => {
    mockUseMetricVisualization.mockReset();
    mockReplace.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("shows placeholder skeleton when loading", () => {
    mockUseMetricVisualization.mockReturnValue({ data: undefined, isLoading: true });

    render(<Visualization metricId="metric-1" goalValue={100} />);

    expect(screen.getByText("Visualization")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /loading visualization/i })).toBeInTheDocument();
    expect(screen.getByTestId(GRANULARITY_PICKER_TEST_ID)).toHaveTextContent(
      DEFAULT_GRANULARITY_LABEL,
    );
    expect(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID)).toHaveTextContent(
      DEFAULT_RELATIVE_RANGE_LABEL,
    );
  });

  it("renders chart with fetched data and goal fallback", () => {
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [1, 2, 3] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-2" />);

    expect(screen.getByTestId("metric-chart")).toHaveTextContent(/"goalValue":null/);
    expect(screen.getByTestId("metric-chart")).toHaveTextContent(/"points":\[1,2,3\]/);
  });

  it("updates URL params when pickers change values", async () => {
    const user = userEvent.setup();
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-3" />);

    await user.click(screen.getByTestId(GRANULARITY_PICKER_TEST_ID));
    expect(screen.getByTestId(GRANULARITY_PICKER_TEST_ID)).toHaveTextContent("granularity-1w");
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("view-bucket=1w"),
      expect.objectContaining({ scroll: false }),
    );

    await user.click(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID));
    expect(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID)).toHaveTextContent("range-relative-90d");
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("view-range=90d"),
      expect.objectContaining({ scroll: false }),
    );
  });

  it("supports absolute range from URL and syncs absolute params", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams(ABSOLUTE_RANGE_SEARCH);
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-4" />);

    expect(screen.getByTestId(GRANULARITY_PICKER_TEST_ID)).toHaveTextContent("granularity-1m");
    expect(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID)).toHaveTextContent("range-absolute");

    await user.click(screen.getByTestId("time-range-picker-abs"));

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("view-start=2026-02-01T00%3A00%3A00.000Z"),
      expect.objectContaining({ scroll: false }),
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("view-end=2026-02-10T00%3A00%3A00.000Z"),
      expect.objectContaining({ scroll: false }),
    );
  });

  it("falls back to default bucket and range for invalid URL params", () => {
    mockSearchParams = new URLSearchParams(
      "view-bucket=invalid&view-range=oops&view-start=invalid&view-end=invalid",
    );
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-6" />);

    expect(screen.getByTestId(GRANULARITY_PICKER_TEST_ID)).toHaveTextContent(
      DEFAULT_GRANULARITY_LABEL,
    );
    expect(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID)).toHaveTextContent(
      DEFAULT_RELATIVE_RANGE_LABEL,
    );
  });

  it("clears absolute params when switching from absolute to relative range", async () => {
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams(ABSOLUTE_RANGE_SEARCH);
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-7" />);

    await user.click(screen.getByTestId(TIME_RANGE_PICKER_REL_TEST_ID));

    const lastReplaceArg = mockReplace.mock.calls.at(-1)?.[0] as string;
    expect(lastReplaceArg).toContain("view-range=90d");
    expect(lastReplaceArg).not.toContain("view-start=");
    expect(lastReplaceArg).not.toContain("view-end=");
  });

  it("shows no-data state when request completes without chart data", () => {
    mockUseMetricVisualization.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<Visualization metricId="metric-8" />);

    expect(screen.getByText("No visualization data available.")).toBeInTheDocument();
  });

  it("ignores unsupported bucket values", async () => {
    const user = userEvent.setup();
    mockUseMetricVisualization.mockReturnValue({
      data: { points: [] },
      isLoading: false,
    });

    render(<Visualization metricId="metric-5" />);

    await user.click(screen.getByTestId("granularity-picker-invalid"));

    expect(screen.getByTestId(GRANULARITY_PICKER_TEST_ID)).toHaveTextContent(
      DEFAULT_GRANULARITY_LABEL,
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
