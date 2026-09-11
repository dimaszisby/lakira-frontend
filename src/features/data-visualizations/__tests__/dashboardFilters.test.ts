import {
  DASHBOARD_DEFAULT_BUCKET,
  DASHBOARD_DEFAULT_RANGE,
  encodeDashboardFilters,
  isTimeRangeEqual,
  parseBucketParam,
  parseDashboardFilters,
  parseRangeParam,
} from "@/features/data-visualizations/dashboardFilters";

const START = "2026-01-01T00:00:00.000Z";
const END = "2026-02-01T00:00:00.000Z";

describe("dashboardFilters", () => {
  describe("parseBucketParam", () => {
    it("accepts a known bucket", () => {
      expect(parseBucketParam("1w")).toBe("1w");
    });

    it.each([null, undefined, "", "2d"])("falls back to the default for %p", (value) => {
      expect(parseBucketParam(value)).toBe(DASHBOARD_DEFAULT_BUCKET);
    });
  });

  describe("parseRangeParam", () => {
    it("parses a relative range", () => {
      expect(parseRangeParam("7d")).toEqual({ mode: "relative", last: "7d" });
    });

    it("parses an absolute range when both ends are present", () => {
      expect(parseRangeParam(null, START, END)).toEqual({
        mode: "absolute",
        start: START,
        end: END,
      });
    });

    it("prefers a valid relative range over absolute ends", () => {
      expect(parseRangeParam("12h", START, END)).toEqual({ mode: "relative", last: "12h" });
    });

    it("falls back to the default for a malformed or half-open range", () => {
      expect(parseRangeParam("7x")).toBe(DASHBOARD_DEFAULT_RANGE);
      expect(parseRangeParam(null, START, null)).toBe(DASHBOARD_DEFAULT_RANGE);
    });
  });

  describe("parseDashboardFilters", () => {
    it("reads URLSearchParams", () => {
      const params = new URLSearchParams({ bucket: "1h", range: "24h" });

      expect(parseDashboardFilters(params)).toEqual({
        bucket: "1h",
        range: { mode: "relative", last: "24h" },
      });
    });

    it("reads a plain object and fills in defaults", () => {
      expect(parseDashboardFilters({ rangeStart: START, rangeEnd: END })).toEqual({
        bucket: DASHBOARD_DEFAULT_BUCKET,
        range: { mode: "absolute", start: START, end: END },
      });
      expect(parseDashboardFilters({})).toEqual({
        bucket: DASHBOARD_DEFAULT_BUCKET,
        range: DASHBOARD_DEFAULT_RANGE,
      });
    });
  });

  describe("encodeDashboardFilters", () => {
    it("round-trips a relative range", () => {
      const filters = parseDashboardFilters({ bucket: "1m", range: "1y" });
      const encoded = encodeDashboardFilters(filters);

      expect(encoded).toEqual({ bucket: "1m", range: "1y" });
      expect(parseDashboardFilters(encoded)).toEqual(filters);
    });

    it("round-trips an absolute range", () => {
      const filters = parseDashboardFilters({ bucket: "1d", rangeStart: START, rangeEnd: END });
      const encoded = encodeDashboardFilters(filters);

      expect(encoded).toEqual({ bucket: "1d", rangeStart: START, rangeEnd: END });
      expect(parseDashboardFilters(encoded)).toEqual(filters);
    });
  });

  describe("isTimeRangeEqual", () => {
    const relative7d = parseRangeParam("7d");
    const absolute = parseRangeParam(null, START, END);

    it("compares relative ranges by their window", () => {
      expect(isTimeRangeEqual(relative7d, parseRangeParam("7d"))).toBe(true);
      expect(isTimeRangeEqual(relative7d, parseRangeParam("30d"))).toBe(false);
    });

    it("compares absolute ranges by both ends", () => {
      expect(isTimeRangeEqual(absolute, parseRangeParam(null, START, END))).toBe(true);
      expect(isTimeRangeEqual(absolute, parseRangeParam(null, START, START))).toBe(false);
    });

    it("never treats different modes as equal", () => {
      expect(isTimeRangeEqual(relative7d, absolute)).toBe(false);
    });
  });
});
