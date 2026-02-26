import { act, fireEvent, render, screen } from "@testing-library/react";

import type { MetricFormInitial } from "@/features/metrics";
import MetricFormDialog from "@/features/metrics/components/MetricFormDialog";

const mockBack = jest.fn();
const mockRefresh = jest.fn();
const metricFormSpy = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/features/metrics/components/MetricForm", () => ({
  __esModule: true,
  default: (props: { initialMetric: MetricFormInitial | null; onClose: () => void }) => {
    metricFormSpy(props);
    return (
      <button type="button" onClick={props.onClose} aria-label="close metric form">
        Close
      </button>
    );
  },
}));

describe("MetricFormDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBack.mockClear();
    mockRefresh.mockClear();
    metricFormSpy.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("passes initialMetric to MetricForm", () => {
    const initialMetric: MetricFormInitial = {
      id: "metric-1",
      name: "Sleep",
      defaultUnit: "hrs",
      description: null,
      isPublic: false,
      originalMetricId: null,
      category: undefined,
    };

    render(<MetricFormDialog initialMetric={initialMetric} />);

    const props = metricFormSpy.mock.calls[0]?.[0] as {
      initialMetric: MetricFormInitial | null;
      onClose: () => void;
    };

    expect(props.initialMetric).toEqual(initialMetric);
    expect(typeof props.onClose).toBe("function");
  });

  it("navigates back and refreshes on close", () => {
    render(<MetricFormDialog initialMetric={null} />);

    fireEvent.click(screen.getByRole("button", { name: /close metric form/i }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
