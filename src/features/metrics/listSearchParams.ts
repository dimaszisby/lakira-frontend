import type { ListMode } from "@/hooks/useListMode";

import type { MetricSortParamViaCursor } from "./sort";
import { DEFAULT_METRIC_SORT, METRICS_PAGE_SIZE, sortFromSearchParams } from "./sort";

export type MetricListSearchParams = {
  mode: ListMode;
  page: number;
  limit: number;
  q: string;
  sort: MetricSortParamViaCursor;
};

export const DEFAULT_METRIC_LIST_PARAMS: MetricListSearchParams = {
  mode: "pages",
  page: 1,
  limit: METRICS_PAGE_SIZE,
  q: "",
  sort: DEFAULT_METRIC_SORT,
};

type SearchInput =
  | URLSearchParams
  | Readonly<URLSearchParams>
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

const toSearchParams = (input?: SearchInput): URLSearchParams => {
  if (!input) return new URLSearchParams();
  if (typeof (input as URLSearchParams).get === "function") {
    const sp = input as URLSearchParams;
    return new URLSearchParams(sp.toString());
  }

  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) params.append(key, String(item));
      });
    } else if (value != null) {
      params.set(key, String(value));
    }
  });
  return params;
};

const clampMode = (value?: string | null): ListMode => {
  return value === "pages" || value === "scroll" ? value : "pages";
};

const clampNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseMetricListSearchParams = (
  raw?: SearchInput,
  fallback: MetricListSearchParams = DEFAULT_METRIC_LIST_PARAMS,
): MetricListSearchParams => {
  const sp = toSearchParams(raw);
  const mode = clampMode(sp.get("mode") ?? fallback.mode);
  const page = clampNumber(sp.get("page"), fallback.page);
  const limit = clampNumber(sp.get("limit"), fallback.limit ?? METRICS_PAGE_SIZE);
  const q = sp.get("q") ?? fallback.q ?? "";
  const sort = sortFromSearchParams(sp) ?? fallback.sort ?? DEFAULT_METRIC_SORT;

  return {
    mode,
    page,
    limit,
    q,
    sort,
  };
};

export const serializeMetricListParams = (params: MetricListSearchParams) => {
  return {
    mode: params.mode,
    page: params.page > 1 ? params.page : undefined,
    limit: params.limit !== METRICS_PAGE_SIZE ? params.limit : undefined,
    q: params.q || undefined,
    sort: params.sort !== DEFAULT_METRIC_SORT ? params.sort : undefined,
  };
};
