import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useOrganizationId } from "@/features/organizations/context";
import { useCursorPager } from "@/lib/cursor/useCursorPager";
import { httpStatusFrom } from "@/services/api/http-status";
import { computeTotalPages, makePageItemsSelect } from "@/utils/cursor/page-map";

import { metricsKeys } from "../keys";
import { toMetricPreviewVM } from "../mappers";
import { getMetricLibraryViaCursor } from "../metric.api";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortParamViaCursor } from "../sort";
import type { MetricCursorPageVM } from "../view-models";

type MetricCursorPageDTO = MetricCursorPage;

export function useMetricsListPaginationViaCursor(params: {
  limit: number;
  sort: MetricSortParamViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
  enabled: boolean;
}) {
  const organizationId = useOrganizationId();
  const { limit, sort, q, filter, enabled = true } = params;

  // Reset dependencies for pager when query params change
  const resetDeps = useMemo(
    () => [limit, sort, q ?? "", filter?.name ?? "", filter?.categoryId ?? ""],
    [limit, sort, q, filter?.name, filter?.categoryId],
  );

  // Centralized page/cursor management
  const pager = useCursorPager(resetDeps);
  const { page, after, setPage, updateNextCursor, canPrev, canNextUsing } = pager;

  const query = useQuery<MetricCursorPageDTO, unknown, MetricCursorPageVM>({
    queryKey: metricsKeys.cursor.pages(organizationId, { limit, sort, q, filter, page, includeTotal: true }),
    queryFn: () => getMetricLibraryViaCursor({ limit, sort, q, filter, after, includeTotal: true }),

    select: makePageItemsSelect(toMetricPreviewVM),
    placeholderData: keepPreviousData,
    staleTime: 30_000,

    retry: (count, err) => {
      const status = httpStatusFrom(err);
      if (status && status < 500 && status !== 429) return false;
      return count < 2;
    },

    enabled: enabled,
  });

  useEffect(() => {
    updateNextCursor(query.data?.nextCursor ?? null);
  }, [page, query.data?.nextCursor, updateNextCursor]);

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const totalCount = query.data?.totalCount;
  const totalPages = computeTotalPages(totalCount, limit);

  // navigation helpers (works even if total unknown)
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
