import type { MetricCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";
import {
  decodeCategoryReturnParams,
  DEFAULT_CATEGORY_LIST_PARAMS,
  encodeCategoryReturnParams,
  parseCategoryListSearchParams,
  serializeCategoryListSearchParams,
} from "@/features/metric-categories/listSearchParams";
import { DEFAULT_METRIC_CATEGORY_SORT } from "@/features/metric-categories/sort";

const CUSTOM: MetricCategoryListSearchParams = {
  mode: "scroll",
  page: 3,
  limit: 25,
  q: "sleep",
  sort: "name",
};

describe("metric category list search params", () => {
  describe("parseCategoryListSearchParams", () => {
    it("returns the defaults for empty input", () => {
      expect(parseCategoryListSearchParams()).toEqual(DEFAULT_CATEGORY_LIST_PARAMS);
      expect(parseCategoryListSearchParams(null)).toEqual(DEFAULT_CATEGORY_LIST_PARAMS);
    });

    it("reads URLSearchParams", () => {
      const params = new URLSearchParams({
        mode: "scroll",
        page: "3",
        limit: "25",
        q: "sleep",
        sort: "name",
      });

      expect(parseCategoryListSearchParams(params)).toEqual(CUSTOM);
    });

    it("reads a Next.js searchParams record, taking the first of repeated keys", () => {
      expect(
        parseCategoryListSearchParams({ page: ["2", "9"], q: "run", mode: undefined }),
      ).toEqual({ ...DEFAULT_CATEGORY_LIST_PARAMS, page: 2, q: "run" });
    });

    it("clamps invalid mode, page and limit to the fallback", () => {
      expect(
        parseCategoryListSearchParams({ mode: "grid", page: "-1", limit: "abc", sort: "bogus" }),
      ).toEqual(DEFAULT_CATEGORY_LIST_PARAMS);
    });

    it("uses a caller-supplied fallback", () => {
      expect(parseCategoryListSearchParams({}, CUSTOM)).toEqual({ ...CUSTOM, sort: "-createdAt" });
    });
  });

  describe("serializeCategoryListSearchParams", () => {
    it("omits values equal to the defaults", () => {
      expect(serializeCategoryListSearchParams(DEFAULT_CATEGORY_LIST_PARAMS)).toEqual({
        mode: undefined,
        page: undefined,
        limit: undefined,
        q: undefined,
        sort: undefined,
      });
    });

    it("keeps values that differ from the defaults", () => {
      expect(serializeCategoryListSearchParams(CUSTOM)).toEqual(CUSTOM);
    });
  });

  describe("return params", () => {
    it("round-trips through encode and decode", () => {
      expect(decodeCategoryReturnParams(encodeCategoryReturnParams(CUSTOM))).toEqual(CUSTOM);
    });

    it("restores defaults for omitted values", () => {
      expect(
        decodeCategoryReturnParams(encodeCategoryReturnParams(DEFAULT_CATEGORY_LIST_PARAMS)),
      ).toEqual({ ...DEFAULT_CATEGORY_LIST_PARAMS, sort: DEFAULT_METRIC_CATEGORY_SORT });
    });

    it.each([null, undefined, "", "{not json"])("returns null for %p", (value) => {
      expect(decodeCategoryReturnParams(value)).toBeNull();
    });
  });
});
