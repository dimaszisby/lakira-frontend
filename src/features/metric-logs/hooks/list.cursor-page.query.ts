import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getMetricLogsListViaCursor } from "../api";
import { metricLogsKeys } from "../keys";
import { toMetricLogVM } from "../mappers";
import type { MetricLogCursorPageResponse, MetricLogFilter, MetricLogSortParam } from "../sort";
import type { MetricLogCursorPageVM } from "../view-models";

type LogCursorPageDTO = MetricLogCursorPageResponse;

export function useMetricLogListCursorPage(params: {
  limit: number;
  sort: MetricLogSortParam;
  q?: string;
  filter?: MetricLogFilter;
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
  }, [params.limit, params.sort, params.q, params.filter?.name, params.filter?.metricId]);

  const after = cursorByPage[page] ?? undefined;

  const query = useQuery<LogCursorPageDTO, Error, MetricLogCursorPageVM>({
    queryKey: metricLogsKeys.cursor.pages({
      ...params,
      page,
      includeTotal: true,
    }),
    queryFn: async () =>
      await getMetricLogsListViaCursor({
        ...params,
        after,
        includeTotal: true,
      }),

    select: (d) => ({
      ...d,
      items: d.items.map(toMetricLogVM),
    }),

    placeholderData: (previousData) => previousData,

    enabled: enabled,
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
