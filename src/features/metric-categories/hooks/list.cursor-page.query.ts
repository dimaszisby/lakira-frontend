import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { listMetricCategories } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type { MetricCategoryCursorPage, MetricCategoryFilter, MetricCategorySort } from "../sort";
import type { MetricCategoryCursorPageVM } from "../view-models";

type CategegoryCursorPageDTO = MetricCategoryCursorPage;

export function useMetricCategoryListCursorPagination(params: {
  limit: number;
  sort: MetricCategorySort;
  q?: string;
  filter?: MetricCategoryFilter;
  enabled: boolean;
}) {
  type Map = Record<number, string | null>;
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Map>({ 1: null });
  const { enabled = true } = params;

  // reset cursors when query changes
  useEffect(() => {
    setPage(1);
    setCursorByPage({ 1: null });
  }, [params.limit, params.sort, params.q, params.filter?.name]);

  const after = cursorByPage[page] ?? undefined;

  const query = useQuery<CategegoryCursorPageDTO, Error, MetricCategoryCursorPageVM>({
    queryKey: metricCategoriesKeys.cursor.pages({
      ...params,
      page,
      includeTotal: true,
    }),
    queryFn: async () =>
      await listMetricCategories({
        ...params,
        after,
        includeTotal: true,
      }),
    select: (d) => ({
      ...d,
      items: d.items.map(toVM),
    }),
    enabled: enabled,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  // when we get new data, store the next cursor for the next page
  useEffect(() => {
    const next = query.data?.nextCursor;
    if (!next) return;
    setCursorByPage((prev) => (prev[page + 1] === next ? prev : { ...prev, [page + 1]: next }));
  }, [page, query.data?.nextCursor]);

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount;
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / params.limit)) : undefined;

  // navigation helpers (works even if total unknown)
  const canPrev = page > 1;
  const canNext = Boolean(cursorByPage[page + 1] ?? query.data?.nextCursor);

  return {
    items,
    page,
    setPage,
    isFetching: query.isFetching,
    totalCount,
    totalPages,
    canPrev,
    canNext,
  };
}
