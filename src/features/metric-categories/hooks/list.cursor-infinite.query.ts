import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useOrganizationId } from "@/features/organizations/context";

import { listMetricCategories } from "../api";
import { metricCategoriesKeys } from "../keys";
import { toVM } from "../mappers";
import type {
  MetricCategoryCursorPage,
  MetricCategoryFilter,
  MetricCategorySortParam,
} from "../sort";
import { DEFAULT_METRIC_CATEGORY_SORT } from "../sort";
import type { MetricCategoryCursorPageVM } from "../view-models";

type UseMetricCategoriesArgs = {
  limit?: number;
  sort?: MetricCategorySortParam;
  q?: string;
  filter?: MetricCategoryFilter;
};

export const useMetricCategoryListCursorInfinite = (
  opts: UseMetricCategoriesArgs & { enabled: boolean },
) => {
  const organizationId = useOrganizationId();
  const { limit = 20, sort = DEFAULT_METRIC_CATEGORY_SORT, q, filter, enabled = true } = opts;

  const query = useInfiniteQuery<
    MetricCategoryCursorPage, // TQueryFnData
    Error, // TError
    InfiniteData<MetricCategoryCursorPageVM, string | undefined>, // TData (no select -> keep InfiniteData)
    ReturnType<typeof metricCategoriesKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricCategoriesKeys.cursor.infinite(organizationId, { limit, sort, q, filter }),
    queryFn: ({ pageParam }) =>
      listMetricCategories({
        limit,
        sort,
        q,
        filter,
        after: pageParam,
      }),

    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    select: (data) => ({
      pageParams: data.pageParams,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map(toVM),
      })),
    }),

    // Keep previous pages visible while fetching the next one
    placeholderData: (prev) => prev,

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    enabled: enabled,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNextPage = query.hasNextPage;
  const loadMore = () => query.fetchNextPage();

  return { ...query, items, hasNextPage, loadMore };
};
