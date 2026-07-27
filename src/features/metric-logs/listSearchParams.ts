import type { MetricLogSortParam } from "./sort";
import { DEFAULT_METRIC_LOG_SORT, sortFromSearchParams } from "./sort";

export type MetricLogListSearchParams = {
  page: number;
  limit: number;
  q: string;
  sort: MetricLogSortParam;
};

export const DEFAULT_METRIC_LOG_LIST_PARAMS: MetricLogListSearchParams = {
  page: 1,
  limit: 50,
  q: "",
  sort: DEFAULT_METRIC_LOG_SORT,
};

type SearchParamsInit =
  | URLSearchParams
  | Readonly<URLSearchParams>
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

const toSearchParams = (input?: SearchParamsInit): URLSearchParams => {
  if (!input) return new URLSearchParams();
  if (typeof (input as URLSearchParams).get === "function") {
    return new URLSearchParams((input as URLSearchParams).toString());
  }

  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (val != null) params.append(key, String(val));
      });
    } else if (value != null) {
      params.set(key, String(value));
    }
  });
  return params;
};

const clampNumber = (raw: string | null, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseMetricLogSearchParams = (
  raw: SearchParamsInit,
  fallback: MetricLogListSearchParams = DEFAULT_METRIC_LOG_LIST_PARAMS,
): MetricLogListSearchParams => {
  const sp = toSearchParams(raw);
  const page = clampNumber(sp.get("page"), fallback.page);
  const limit = clampNumber(sp.get("limit"), fallback.limit);
  const q = sp.get("q") ?? fallback.q ?? "";
  const sort = sortFromSearchParams(sp) ?? fallback.sort ?? DEFAULT_METRIC_LOG_SORT;

  return {
    page,
    limit,
    q,
    sort,
  };
};

export const serializeMetricLogSearchParams = (params: MetricLogListSearchParams) => ({
  page: params.page > 1 ? params.page : undefined,
  limit: params.limit !== DEFAULT_METRIC_LOG_LIST_PARAMS.limit ? params.limit : undefined,
  q: params.q || undefined,
  sort: params.sort !== DEFAULT_METRIC_LOG_LIST_PARAMS.sort ? params.sort : undefined,
});
