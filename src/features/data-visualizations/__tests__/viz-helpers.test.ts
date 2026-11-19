import { execFileSync } from "node:child_process";
import path from "node:path";

import type { VizResponse } from "@/features/data-visualizations/types";
import {
  buildChartSummary,
  describeRange,
  seriesToXY,
} from "@/features/data-visualizations/viz-helpers";

const JAKARTA = "Asia/Jakarta";
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
    tz: JAKARTA,
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

  // A label is the bucket's wall time written with a "Z" (lakira-backend ADR-0062): local midnight
  // on 1 Feb is "2026-02-01T00:00:00.000Z" whatever zone the backend cut it in.
  it("names the labelled day when the zone is west of UTC", () => {
    const newYork = data();
    newYork.meta.tz = "America/New_York";

    expect(buildChartSummary(newYork)).toMatch(/^From 1 Feb 2026 to 3 Feb 2026: /);
  });

  it("falls back to UTC for a zone it does not know", () => {
    const unknownZone = data();
    unknownZone.meta.tz = "Not/A_Zone";

    expect(buildChartSummary(unknownZone)).toMatch(/^From 1 Feb 2026 to 3 Feb 2026: /);
  });
});

describe("seriesToXY", () => {
  // Jest runs in UTC (jest.global-setup.ts), where a label and its wall time agree, so the bug
  // cannot show in this process. Each zone runs the helper in a child Node with TZ set. Node strips
  // the types itself, so viz-helpers.ts must keep only type imports: a runtime `@/` import breaks this.
  const helpers = path.resolve(__dirname, "../viz-helpers.ts");
  const wallTimesIn = (zone: string, labels: string[]) => {
    const script = `import(${JSON.stringify(helpers)}).then((m) => {
      const points = m.seriesToXY(${JSON.stringify(labels)}.map((l) => ({ bucketStartISO: l, value: 1 })));
      console.log(JSON.stringify(points.map(({ x }) =>
        [x.getFullYear(), x.getMonth() + 1, x.getDate(), x.getHours()])));
    });`;
    const out = execFileSync(
      process.execPath,
      ["--experimental-strip-types", "--no-warnings", "-e", script],
      { env: { ...process.env, TZ: zone }, encoding: "utf8", timeout: 10_000 },
    );
    return JSON.parse(out) as number[][];
  };

  it.each([JAKARTA, "America/New_York"])(
    "places a bucket at its labelled wall time when the browser is in %s",
    (zone) => {
      expect(wallTimesIn(zone, ["2026-02-01T09:00:00.000Z", "2026-02-01T00:00:00.000Z"])).toEqual([
        [2026, 2, 1, 9],
        [2026, 2, 1, 0],
      ]);
    },
  );

  it("keeps a gap as NaN and an unparseable label as an invalid date", () => {
    const [point] = seriesToXY([{ bucketStartISO: "not a date", value: null }]);

    expect(Number.isNaN((point.x as Date).getTime())).toBe(true);
    expect(point.y).toBeNaN();
  });
});

describe("describeRange", () => {
  const TZ = JAKARTA;

  it("gives the first and last day in the time zone, the end being exclusive", () => {
    // 1 Dec 00:00 to 31 Dec 00:00 in Jakarta (UTC+7): the last day shown is 30 Dec.
    expect(
      describeRange(
        { startISO: "2025-11-30T17:00:00.000Z", endISO: "2025-12-30T17:00:00.000Z" },
        TZ,
      ),
    ).toBe("1 Dec 2025 – 30 Dec 2025");
  });

  it("gives one date for a range within a single day", () => {
    expect(
      describeRange(
        { startISO: "2025-11-30T17:00:00.000Z", endISO: "2025-12-01T17:00:00.000Z" },
        TZ,
      ),
    ).toBe("1 Dec 2025");
  });

  it("returns null when either end does not parse", () => {
    expect(
      describeRange({ startISO: "not a date", endISO: "2025-12-01T17:00:00.000Z" }, TZ),
    ).toBeNull();
  });

  it("falls back to UTC for a time zone Intl does not know", () => {
    expect(
      describeRange(
        { startISO: "2025-12-01T00:00:00.000Z", endISO: "2025-12-03T00:00:00.000Z" },
        "Not/AZone",
      ),
    ).toBe("1 Dec 2025 – 2 Dec 2025");
  });
});
