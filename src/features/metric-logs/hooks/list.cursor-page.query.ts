import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useOrganizationId } from "@/features/organizations/context";
import { useCursorPager } from "@/lib/cursor/useCursorPager";
import { computeTotalPages, makePageItemsSelect } from "@/utils/cursor/page-map";

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
  const organizationId = useOrganizationId();
  const { limit, sort, q, filter, enabled = true } = params;

  const resetDeps = useMemo(
    () => [limit, sort, q ?? "", filter?.name ?? "", filter?.metricId ?? ""],
    [limit, sort, q, filter?.name, filter?.metricId],
  );

  const { page, after, setPage, updateNextCursor, canPrev, canNextUsing } =
    useCursorPager(resetDeps);

  const query = useQuery<LogCursorPageDTO, Error, MetricLogCursorPageVM>({
    queryKey: metricLogsKeys.cursor.pages(organizationId, {
      limit,
      sort,
      q,
      filter,
      page,
      includeTotal: true,
    }),
    queryFn: () =>
      getMetricLogsListViaCursor({
        limit,
        sort,
        q,
        filter,
        after,
        includeTotal: true,
      }),

    select: makePageItemsSelect(toMetricLogVM),
    placeholderData: keepPreviousData,

    staleTime: 30_000,
    enabled,
  });

  useEffect(() => {
    updateNextCursor(query.data?.nextCursor ?? null);
  }, [page, query.data?.nextCursor, updateNextCursor]);

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const totalCount = query.data?.totalCount;
  const totalPages = computeTotalPages(totalCount, limit);
  const canNext = canNextUsing(query.data?.nextCursor);

  return {
    items,
    page,
    setPage,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    totalCount,
    totalPages,
    canPrev,
    canNext,
  };
}
