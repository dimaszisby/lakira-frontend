import { act, fireEvent, render, screen } from "@testing-library/react";

import MetricSettingsFormDialog from "@/features/metric-settings/components/MetricSettingsFormDialog";
import type { MetricSettingsExtendedVM } from "@/features/metric-settings/view-models";

const mockBack = jest.fn();
const mockRefresh = jest.fn();
const metricSettingsFormSpy = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/features/metric-settings/components/MetricSettingsForm", () => ({
  __esModule: true,
  default: (props: {
    metricId: string;
    initialSettings: MetricSettingsExtendedVM | null;
    onClose: () => void;
  }) => {
    metricSettingsFormSpy(props);
    return (
      <button type="button" onClick={props.onClose} aria-label="close metric settings form">
        Close
      </button>
    );
  },
}));

describe("MetricSettingsFormDialog", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockBack.mockClear();
    mockRefresh.mockClear();
    metricSettingsFormSpy.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("passes props to MetricSettingsForm", () => {
    const initialSettings: MetricSettingsExtendedVM = {
      id: "settings-1",
      metricId: "metric-1",
      isActive: true,
      goalEnabled: false,
      goalType: null,
      goalValue: null,
      timeFrameEnabled: false,
      startDate: null,
      deadlineDate: null,
      alertEnabled: false,
      alertThresholds: 0,
      isAchieved: false,
      displayOptions: {
        showOnDashboard: false,
        priority: null,
        chartType: null,
        color: null,
      },
      createdAt: "2026-02-26T00:00:00.000Z",
      updatedAt: "2026-02-26T00:00:00.000Z",
    };

    render(<MetricSettingsFormDialog metricId="metric-1" initialSettings={initialSettings} />);

    const props = metricSettingsFormSpy.mock.calls[0]?.[0] as {
      metricId: string;
      initialSettings: MetricSettingsExtendedVM | null;
      onClose: () => void;
    };

    expect(props.metricId).toBe("metric-1");
    expect(props.initialSettings).toEqual(initialSettings);
    expect(typeof props.onClose).toBe("function");
  });

  it("navigates back and refreshes on close", () => {
    render(<MetricSettingsFormDialog metricId="metric-1" initialSettings={null} />);

    fireEvent.click(screen.getByRole("button", { name: /close metric settings form/i }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockRefresh).not.toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
