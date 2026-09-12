import type { MetricLogListSearchParams } from "@/features/metric-logs/listSearchParams";
import {
  DEFAULT_METRIC_LOG_LIST_PARAMS,
  parseMetricLogSearchParams,
  serializeMetricLogSearchParams,
} from "@/features/metric-logs/listSearchParams";

const CUSTOM: MetricLogListSearchParams = {
  ...DEFAULT_METRIC_LOG_LIST_PARAMS,
  page: 2,
  limit: 10,
  q: "morning",
};

describe("metric log list search params", () => {
  describe("parseMetricLogSearchParams", () => {
    it("returns the defaults for empty input", () => {
      expect(parseMetricLogSearchParams(null)).toEqual(DEFAULT_METRIC_LOG_LIST_PARAMS);
    });

    it("reads URLSearchParams", () => {
      const params = new URLSearchParams({ page: "2", limit: "10", q: "morning" });

      expect(parseMetricLogSearchParams(params)).toEqual(CUSTOM);
    });

    it("reads a Next.js searchParams record, taking the first of repeated keys", () => {
      expect(parseMetricLogSearchParams({ page: ["2", "5"], limit: "10", q: "morning" })).toEqual(
        CUSTOM,
      );
    });

    it("clamps invalid page, limit and sort to the fallback", () => {
      expect(
        parseMetricLogSearchParams({ page: "nope", limit: "-5", sort: "bogus" }, CUSTOM),
      ).toEqual({ ...CUSTOM, q: "morning" });
    });
  });

  describe("serializeMetricLogSearchParams", () => {
    it("omits values equal to the defaults", () => {
      expect(serializeMetricLogSearchParams(DEFAULT_METRIC_LOG_LIST_PARAMS)).toEqual({
        page: undefined,
        limit: undefined,
        q: undefined,
        sort: undefined,
      });
    });

    it("keeps values that differ from the defaults", () => {
      expect(serializeMetricLogSearchParams(CUSTOM)).toEqual({
        page: 2,
        limit: 10,
        q: "morning",
        sort: undefined,
      });
    });
  });
});
