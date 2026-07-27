import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useCursorPager } from "@/lib/cursor/useCursorPager";
import { computeTotalPages, makePageItemsSelect } from "@/utils/cursor/page-map";

import { listMetricCategories } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type {
  MetricCategoryCursorPage,
  MetricCategoryFilter,
  MetricCategorySortParam,
} from "../sort";
import type { MetricCategoryCursorPageVM } from "../view-models";

type CategoryCursorPageDTO = MetricCategoryCursorPage;

export function useMetricCategoryListCursorPagination(params: {
  limit: number;
  sort: MetricCategorySortParam;
  q?: string;
  filter?: MetricCategoryFilter;
  enabled: boolean;
}) {
  const { limit, sort, q, filter, enabled = true } = params;

  const resetDeps = useMemo(
    () => [limit, sort, q ?? "", filter?.name ?? ""],
    [limit, sort, q, filter?.name],
  );

  const { page, after, setPage, updateNextCursor, canPrev, canNextUsing } =
    useCursorPager(resetDeps);

  const query = useQuery<CategoryCursorPageDTO, Error, MetricCategoryCursorPageVM>({
    queryKey: metricCategoriesKeys.cursor.pages({
      limit,
      sort,
      q,
      filter,
      page,
      includeTotal: true,
    }),
    queryFn: () =>
      listMetricCategories({
        limit,
        sort,
        q,
        filter,
        after,
        includeTotal: true,
      }),
    select: makePageItemsSelect(toVM),
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
