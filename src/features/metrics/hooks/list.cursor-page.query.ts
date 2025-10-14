import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { metricsKeys } from "../keys";
import { toMetricPreviewVM } from "../mappers";
import { getMetricLibraryViaCursor } from "../metric.api";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortViaCursor } from "../sort";
import type { MetricCursorPageVM } from "../view-models";

type MetricCursorPageDTO = MetricCursorPage;

export default function useMetricsListPaginationViaCursor(params: {
  limit: number;
  sort: MetricSortViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
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
  }, [params.limit, params.sort, params.q, params.filter?.name, params.filter?.categoryId]);

  const after = cursorByPage[page] ?? undefined;

  const query = useQuery<MetricCursorPageDTO, Error, MetricCursorPageVM>({
    queryKey: metricsKeys.cursor.pages({ ...params, page, includeTotal: true }),
    queryFn: async () =>
      await getMetricLibraryViaCursor({
        ...params,
        after,
        includeTotal: true,
      }),
    select: (d) => ({
      ...d,
      items: d.items.map(toMetricPreviewVM),
    }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: enabled,
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
