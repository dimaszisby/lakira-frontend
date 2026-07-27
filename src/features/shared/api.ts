type CursorFilter = Record<string, string | undefined | null>;

export type CursorListParams<TSort extends string, TFilter extends CursorFilter> = {
  limit?: number;
  sort?: TSort;
  q?: string;
  filter?: TFilter;
  after?: string;
  includeTotal?: boolean;
};

const trimValue = (value?: string | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const shouldSkipValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
};

/**
 * Builds a query string prefixed with `?` while omitting empty values.
 * Keys are encoded in a stable order which keeps deduped keys for React Query caches.
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  const keys = Object.keys(params).sort();
  const search = new URLSearchParams();

  keys.forEach((key) => {
    const value = params[key];
    if (shouldSkipValue(value)) return;
    search.set(key, String(value));
  });

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

/**
 * Builds a cursor-based query string that includes filter[...] parameters.
 */
export const buildCursorQueryString = <
  TSort extends string,
  TFilter extends CursorFilter = Record<string, string | undefined>,
>({
  limit,
  sort,
  q,
  filter,
  after,
  includeTotal,
}: CursorListParams<TSort, TFilter>): string => {
  const search = new URLSearchParams();

  if (typeof limit === "number") search.set("limit", String(limit));
  if (sort) search.set("sort", sort);

  const trimmedQ = trimValue(q);
  if (trimmedQ) search.set("q", trimmedQ);

  if (filter) {
    Object.entries(filter).forEach(([key, rawValue]) => {
      const value = trimValue(rawValue);
      if (!value) return;
      search.set(`filter[${key}]`, value);
    });
  }

  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export type { RequestOpts } from "@/types/generics/RequestOpts";
