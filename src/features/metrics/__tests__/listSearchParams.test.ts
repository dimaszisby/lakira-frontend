import type { MetricListSearchParams } from "@/features/metrics/listSearchParams";
import {
  DEFAULT_METRIC_LIST_PARAMS,
  parseMetricListSearchParams,
  serializeMetricListParams,
} from "@/features/metrics/listSearchParams";
import { METRICS_PAGE_SIZE } from "@/features/metrics/sort";

const CUSTOM: MetricListSearchParams = {
  mode: "scroll",
  page: 4,
  limit: 50,
  q: "steps",
  sort: "name",
};

describe("metric list search params", () => {
  describe("parseMetricListSearchParams", () => {
    it("returns the defaults for empty input", () => {
      expect(parseMetricListSearchParams()).toEqual(DEFAULT_METRIC_LIST_PARAMS);
      expect(DEFAULT_METRIC_LIST_PARAMS.limit).toBe(METRICS_PAGE_SIZE);
    });

    it("reads URLSearchParams", () => {
      const params = new URLSearchParams({
        mode: "scroll",
        page: "4",
        limit: "50",
        q: "steps",
        sort: "name",
      });

      expect(parseMetricListSearchParams(params)).toEqual(CUSTOM);
    });

    it("reads a Next.js searchParams record, taking the first of repeated keys", () => {
      expect(parseMetricListSearchParams({ limit: ["10", "99"], q: undefined })).toEqual({
        ...DEFAULT_METRIC_LIST_PARAMS,
        limit: 10,
      });
    });

    it("clamps invalid mode, page and limit to the fallback", () => {
      expect(
        parseMetricListSearchParams({ mode: "table", page: "0", limit: "Infinity", sort: "?" }),
      ).toEqual(DEFAULT_METRIC_LIST_PARAMS);
    });
  });

  describe("serializeMetricListParams", () => {
    it("omits defaults except mode", () => {
      expect(serializeMetricListParams(DEFAULT_METRIC_LIST_PARAMS)).toEqual({
        mode: "pages",
        page: undefined,
        limit: undefined,
        q: undefined,
        sort: undefined,
      });
    });

    it("keeps values that differ from the defaults", () => {
      expect(serializeMetricListParams(CUSTOM)).toEqual(CUSTOM);
    });
  });
});
