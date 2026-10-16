import type { VizResponse } from "@/features/data-visualizations/types";
import { buildChartSummary } from "@/features/data-visualizations/viz-helpers";

const FIRST = "2026-02-01T00:00:00.000Z";
const LAST = "2026-02-03T00:00:00.000Z";

const data = (overrides: Partial<VizResponse> = {}): VizResponse => ({
  series: [
    { bucketStartISO: FIRST, value: 12 },
    { bucketStartISO: "2026-02-02T00:00:00.000Z", value: null },
    { bucketStartISO: LAST, value: 20 },
  ],
  stats: { average: 16, min: 12, max: 20, count: 2 },
  meta: {
    metricId: "metric-1",
    unit: "kg",
    bucket: "1d",
    tz: "Asia/Jakarta",
    range: { startISO: FIRST, endISO: "2026-02-04T00:00:00.000Z" },
  },
  ...overrides,
});

describe("buildChartSummary", () => {
  it("gives the span, the figures with their unit and the number of logs", () => {
    expect(buildChartSummary(data())).toBe(
      "From 1 Feb 2026 to 3 Feb 2026: " +
        "average 16 kg, minimum 12 kg, maximum 20 kg, from 2 logs.",
    );
  });

  it("writes the figures bare when the metric has no unit", () => {
    const noUnit = data();
    noUnit.meta.unit = "  ";

    expect(buildChartSummary(noUnit)).toContain("average 16, minimum 12, maximum 20, from 2 logs.");
  });

  it("rounds to two decimal places", () => {
    expect(
      buildChartSummary(data({ stats: { average: 35.13333, min: 12, max: 20, count: 2 } })),
    ).toContain("average 35.13 kg");
  });

  it("names the goal only when one is drawn", () => {
    expect(buildChartSummary(data(), 18)).toMatch(/from 2 logs\. Goal 18 kg\.$/);
    expect(buildChartSummary(data(), null)).not.toContain("Goal");
    expect(buildChartSummary(data(), Number.NaN)).not.toContain("Goal");
  });

  it("leaves out a figure the backend did not compute", () => {
    const summary = buildChartSummary(
      data({ stats: { average: null, min: 12, max: 20, count: 2 } }),
    );

    expect(summary).not.toContain("average");
    expect(summary).toContain(": minimum 12 kg, maximum 20 kg, from 2 logs.");
  });

  it("counts a single log in the singular", () => {
    expect(
      buildChartSummary(data({ stats: { average: 12, min: 12, max: 12, count: 1 } })),
    ).toContain("from 1 log.");
  });

  it("names one day when the series covers one", () => {
    expect(buildChartSummary(data({ series: [{ bucketStartISO: FIRST, value: 12 }] }))).toMatch(
      /^On 1 Feb 2026: /,
    );
  });

  it("dates each bucket in the zone the backend cut it in", () => {
    // Midnight in Jakarta is 17:00 the day before in UTC.
    const jakartaMidnight = data({
      series: [{ bucketStartISO: "2026-01-31T17:00:00.000Z", value: 12 }],
    });

    expect(buildChartSummary(jakartaMidnight)).toMatch(/^On 1 Feb 2026: /);

    jakartaMidnight.meta.tz = "UTC";
    expect(buildChartSummary(jakartaMidnight)).toMatch(/^On 31 Jan 2026: /);
  });

  it("falls back to UTC for a zone it does not know", () => {
    const unknownZone = data();
    unknownZone.meta.tz = "Not/A_Zone";

    expect(buildChartSummary(unknownZone)).toMatch(/^From 1 Feb 2026 to 3 Feb 2026: /);
  });
});
