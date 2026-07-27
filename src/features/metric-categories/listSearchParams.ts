import type { ListMode } from "@/hooks/useListMode";

import type { MetricCategorySortParam } from "./sort";
import { DEFAULT_METRIC_CATEGORY_SORT, sortFromSearchParams } from "./sort";

export type MetricCategoryListSearchParams = {
  mode: ListMode;
  page: number;
  limit: number;
  q: string;
  sort: MetricCategorySortParam;
};

export const DEFAULT_CATEGORY_LIST_PARAMS: MetricCategoryListSearchParams = {
  mode: "pages",
  page: 1,
  limit: 50,
  q: "",
  sort: DEFAULT_METRIC_CATEGORY_SORT,
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

const clampMode = (value?: string | null): ListMode =>
  value === "pages" || value === "scroll" ? value : "pages";

const clampNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseCategoryListSearchParams = (
  raw?: SearchInput,
  fallback: MetricCategoryListSearchParams = DEFAULT_CATEGORY_LIST_PARAMS,
): MetricCategoryListSearchParams => {
  const sp = toSearchParams(raw);
  const mode = clampMode(sp.get("mode") ?? fallback.mode);
  const page = clampNumber(sp.get("page"), fallback.page);
  const limit = clampNumber(sp.get("limit"), fallback.limit);
  const q = sp.get("q") ?? fallback.q ?? "";
  const sort = sortFromSearchParams(sp) ?? fallback.sort ?? DEFAULT_METRIC_CATEGORY_SORT;

  return {
    mode,
    page,
    limit,
    q,
    sort,
  };
};

export const serializeCategoryListSearchParams = (params: MetricCategoryListSearchParams) => ({
  mode: params.mode === DEFAULT_CATEGORY_LIST_PARAMS.mode ? undefined : params.mode,
  page: params.page > 1 ? params.page : undefined,
  limit: params.limit !== DEFAULT_CATEGORY_LIST_PARAMS.limit ? params.limit : undefined,
  q: params.q || undefined,
  sort: params.sort !== DEFAULT_METRIC_CATEGORY_SORT ? params.sort : undefined,
});

export const encodeCategoryReturnParams = (params: MetricCategoryListSearchParams) => {
  const serialized = serializeCategoryListSearchParams(params);
  return JSON.stringify(serialized);
};

export const decodeCategoryReturnParams = (value?: string | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<MetricCategoryListSearchParams>;
    return {
      mode: parsed.mode ?? DEFAULT_CATEGORY_LIST_PARAMS.mode,
      page: parsed.page ?? DEFAULT_CATEGORY_LIST_PARAMS.page,
      limit: parsed.limit ?? DEFAULT_CATEGORY_LIST_PARAMS.limit,
      q: parsed.q ?? DEFAULT_CATEGORY_LIST_PARAMS.q,
      sort: parsed.sort ?? DEFAULT_CATEGORY_LIST_PARAMS.sort,
    } satisfies MetricCategoryListSearchParams;
  } catch {
    return null;
  }
};
