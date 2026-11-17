import { screen } from "@testing-library/react";

import MetricCardFromBatch from "@/app/(app)/dashboard/_components/MetricCardFromBatch";
import type { DashboardVizItem } from "@/features/data-visualizations/types";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const chartProps = jest.fn();

jest.mock("@/features/data-visualizations/components/MetricChart", () => ({
  __esModule: true,
  default: (props: unknown) => {
    chartProps(props);
    return null;
  },
}));

const REQUESTED = {
  bucket: "1d" as const,
  startISO: "2026-01-01T00:00:00.000Z",
  endISO: "2026-02-01T00:00:00.000Z",
};

const item = {
  metricId: "11111111-1111-4111-8111-111111111111",
  name: "Sleep",
  unit: "hours",
  category_name: null,
  category_color: null,
  category_icon: null,
  priority: null,
  series: [],
  stats: { average: null, min: null, max: null, count: 0 },
  requestedRange: REQUESTED,
  // A different bucket from the requested one, so a card reading the response's bucket fails.
  actualRange: {
    bucket: "1w" as const,
    startISO: "2025-09-30T17:00:00.000Z",
    endISO: "2025-12-29T17:00:00.000Z",
  },
  fallbackRangeUsed: true,
  fallbackStrategy: "last_activity_window" as const,
  firstLogAt: null,
  lastLogAt: null,
  latestBucketStart: null,
  latestValue: null,
  totalLogs: 4,
} satisfies DashboardVizItem;

describe("MetricCardFromBatch", () => {
  beforeEach(() => chartProps.mockClear());

  it("charts the item's own range and bucket when the backend fell back", () => {
    renderWithProviders(<MetricCardFromBatch item={item} tz="Asia/Jakarta" />);

    expect(chartProps).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            bucket: "1w",
            range: { startISO: item.actualRange.startISO, endISO: item.actualRange.endISO },
          }),
        }),
      }),
    );
  });

  it("names the last period with logs when the backend fell back", () => {
    renderWithProviders(<MetricCardFromBatch item={item} tz="Asia/Jakarta" />);

    expect(
      screen.getByText(
        "No logs in the selected range. Showing 1 Oct 2025 – 29 Dec 2025, the last period with logs.",
      ),
    ).toBeInTheDocument();
  });

  it("shows no notice and still renders when the category fields are null", () => {
    renderWithProviders(
      <MetricCardFromBatch
        item={{ ...item, actualRange: REQUESTED, fallbackRangeUsed: false, fallbackStrategy: null }}
        tz="Asia/Jakarta"
      />,
    );

    expect(screen.getByText("Sleep")).toBeInTheDocument();
    expect(screen.queryByText(/no logs in the selected range/i)).not.toBeInTheDocument();
  });
});
