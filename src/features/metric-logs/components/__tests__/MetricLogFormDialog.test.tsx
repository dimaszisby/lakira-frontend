import { act, fireEvent, render, screen } from "@testing-library/react";

import MetricLogFormDialog from "@/features/metric-logs/components/MetricLogFormDialog";
import type { MetricLogVM } from "@/features/metric-logs/view-models";

const mockBack = jest.fn();
const mockRefresh = jest.fn();
const metricLogFormSpy = jest.fn();
const FIXED_ISO = "2026-02-26T00:00:00.000Z";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/features/metric-logs/components/LogForm", () => ({
  __esModule: true,
  default: (props: {
    metricId: string;
    initialLog?: MetricLogVM | null;
    onClose: () => void;
  }) => {
    metricLogFormSpy(props);
    return (
      <button type="button" onClick={props.onClose} aria-label="close metric log form">
        Close
      </button>
    );
  },
}));

describe("MetricLogFormDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBack.mockClear();
    mockRefresh.mockClear();
    metricLogFormSpy.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("passes props to MetricLogForm", () => {
    const initialLog: MetricLogVM = {
      id: "log-1",
      metricId: "metric-1",
      logValue: 123,
      loggedAt: FIXED_ISO,
      type: "manual",
      createdAt: FIXED_ISO,
      updatedAt: FIXED_ISO,
    };

    render(<MetricLogFormDialog metricId="metric-1" initialLog={initialLog} />);

    const props = metricLogFormSpy.mock.calls[0]?.[0] as {
      metricId: string;
      initialLog?: MetricLogVM | null;
      onClose: () => void;
    };

    expect(props.metricId).toBe("metric-1");
    expect(props.initialLog).toEqual(initialLog);
    expect(typeof props.onClose).toBe("function");
  });

  it("navigates back and refreshes on close", () => {
    render(<MetricLogFormDialog metricId="metric-1" initialLog={null} />);

    fireEvent.click(screen.getByRole("button", { name: /close metric log form/i }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
