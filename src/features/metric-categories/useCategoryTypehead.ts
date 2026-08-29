import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";

import { useOrganizationId } from "@/features/organizations/context";

import { listMetricCategories } from "./api";
import { metricCategoriesKeys } from "./keys";
import { toVM } from "./mappers";
import type { MetricCategoryCursorPage } from "./sort";
import type { MetricCategoryCursorPageVM } from "./view-models";

// export type CategoryOption = {
//   value: string;
//   label: string;
//   color: string;
//   icon: string;
//   metricCount: number;
// };

// const toOption = (c: MetricCategoryResponseDTO): MetricCategoryVM => ({
//   id: c.id,
//   name: c.name,
//   color: c.color,
//   icon: c.icon,
//   metricCount: c.metricCount ?? 0,
// });

export function useCategoryTypeahead(rawQuery: string, limit = 15) {
  const organizationId = useOrganizationId();
  const [q, setQ] = useState<string>(rawQuery.trim());
  useDebounce(() => setQ(rawQuery.trim()), 250, [rawQuery]);

  const query = useInfiniteQuery<
    MetricCategoryCursorPage, // TQueryFnData (server response page)
    Error, // TError
    InfiniteData<MetricCategoryCursorPageVM, string | undefined>, // TData
    ReturnType<typeof metricCategoriesKeys.cursor.infinite>, // TQueryKey
    string | undefined // TPageParam
  >({
    queryKey: metricCategoriesKeys.cursor.infinite(organizationId, {
      limit,
      sort: "-metricCount", // sorted from the most used
      q: q || undefined,
      filter: undefined,
    }),
    queryFn: ({ pageParam }) =>
      listMetricCategories({
        limit,
        sort: "-metricCount",
        q: q || undefined,
        after: pageParam,
      }),

    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,

    select: (data) => ({
      pageParams: data.pageParams,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map(toVM),
      })),
    }),

    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return {
    ...query,
    q,
    items,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
