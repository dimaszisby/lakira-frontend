"use client";

import { useRouter } from "next/navigation";
import { Plus } from "phosphor-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MetricTable from "@/features/metrics/components/MetricTable";
import { mobileColumns } from "@/features/metrics/components/table-config";
import {
  useMetricInfiniteViaCursor,
  useMetricsListPaginationViaCursor,
} from "@/features/metrics/hooks";
import type { MetricListSearchParams } from "@/features/metrics/listSearchParams";
import type { MetricSortParamViaCursor } from "@/features/metrics/sort";
import {
  DEFAULT_METRIC_SORT,
  isSortableColumn,
  METRICS_PAGE_SIZE,
  nextSortForColumn,
  parseSort,
} from "@/features/metrics/sort";
import type { MetricPreviewVM } from "@/features/metrics/view-models";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRouteParams } from "@/hooks/useRouteParams";
import { metricRoutes } from "@/lib/routes";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import { useCategoryMetricSearchState } from "@/src/features/metrics/hooks/category-metric.search-state";
import Button from "@/ui/Button";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SkeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

type MetricListSectionProps = {
  initialParams: MetricListSearchParams;
};

const MetricListSection = ({ initialParams }: MetricListSectionProps) => {
  const router = useRouter();
  const { categoryId } = useRouteParams<{ categoryId: string }>({ required: ["categoryId"] });
  const { params, replaceParams } = useCategoryMetricSearchState(categoryId, initialParams);
  const prefetchedMetricIds = useRef<Set<string>>(new Set());

  const [searchValue, setSearchValue] = useState(() => params.q ?? "");
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  useEffect(() => {
    const nextQ = debouncedSearch.trim();
    if ((params.q ?? "") === nextQ) return;
    replaceParams({ ...params, q: nextQ, page: 1 });
  }, [debouncedSearch, params, replaceParams]);

  const limit = params.limit ?? METRICS_PAGE_SIZE;
  const sort: MetricSortParamViaCursor = params.sort ?? DEFAULT_METRIC_SORT;
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);
  const isPages = params.mode === "pages";

  const queryOptions = useMemo(() => {
    const base: {
      limit: number;
      sort: MetricSortParamViaCursor;
      q?: string;
      filter: { categoryId: string };
    } = { limit, sort, filter: { categoryId } };
    if (params.q) base.q = params.q;
    return base;
  }, [limit, sort, params.q, categoryId]);

  const infinite = useMetricInfiniteViaCursor({ ...queryOptions, enabled: !isPages });
  const pages = useMetricsListPaginationViaCursor({ ...queryOptions, enabled: isPages });

  const handleParamsChange = useCallback(
    (next: Partial<typeof params>) => {
      replaceParams({ ...params, ...next });
    },
    [params, replaceParams],
  );

  const onColumnSort = useMemo(
    () =>
      makeOnColumnSort(isSortableColumn, nextSortForColumn, (column) => {
        if (!isSortableColumn(column)) return;
        const nextSort = nextSortForColumn(sort, column);
        handleParamsChange({ sort: nextSort, page: 1 });
      }),
    [handleParamsChange, sort],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      pages.setPage(nextPage);
      handleParamsChange({ page: nextPage });
    },
    [handleParamsChange, pages],
  );

  const handleRowClick = useCallback(
    (metric: MetricPreviewVM) => router.push(metricRoutes.detail(metric.id)),
    [router],
  );

  const handlePrefetchMetric = useCallback(
    (metric: MetricPreviewVM) => {
      if (prefetchedMetricIds.current.has(metric.id)) return;
      prefetchedMetricIds.current.add(metric.id);
      void router.prefetch(metricRoutes.detail(metric.id));
    },
    [router],
  );

  const handleAddMetric = useCallback(() => {
    router.push(metricRoutes.modal.new());
  }, [router]);

  const handleEditMetric = useCallback(
    (metric: MetricPreviewVM) => router.push(metricRoutes.modal.edit(metric.id)),
    [router],
  );

  const isLoading = isPages
    ? pages.isFetching && pages.items.length === 0
    : infinite.isLoading && infinite.items.length === 0;
  const isEmpty = isPages ? pages.items.length === 0 : infinite.items.length === 0;

  const header = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={searchValue}
        onChange={setSearchValue}
        onClear={() => setSearchValue("")}
        isLoading={
          isPages
            ? pages.isFetching && !!pages.items.length
            : infinite.isFetching && !infinite.isFetchingNextPage
        }
        placeholder="Search metrics…"
        className="flex-1"
      />
      <div className="flex gap-2">
        <Button variant="primary" onClick={handleAddMetric} leftIcon={<Plus size={18} />}>
          Add Metric
        </Button>
      </div>
    </div>
  );

  const paginatedSection = (
    <>
      <MetricTable
        metrics={pages.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onRowClick={handleRowClick}
        onRowHover={handlePrefetchMetric}
      />
      <Pagination
        page={pages.page}
        pageSize={limit}
        total={pages.totalCount}
        onChange={handlePageChange}
        canPrev={pages.canPrev}
        canNext={pages.canNext}
      />
    </>
  );

  const infiniteSection = (
    <>
      <MetricTable
        metrics={infinite.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onRowClick={handleRowClick}
        variant="mobile"
        onRowHover={handlePrefetchMetric}
      />
      {infinite.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              void infinite.fetchNextPage();
            }}
            disabled={infinite.isFetchingNextPage}
          >
            {infinite.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {header}
      <SortChipGroup
        sortBy={sortField as keyof MetricPreviewVM}
        sortOrder={sortDir}
        onSort={(key) => onColumnSort(String(key))}
        columns={mobileColumns}
        className="lg:hidden"
      />

      {isLoading ? (
        <SkeletonLoader count={10} className="h-10" />
      ) : isEmpty ? (
        <EmptyDataIndicator
          title="No Metrics"
          description="There are no metrics in this category yet."
          tooltip="Add your first metric"
        />
      ) : isPages ? (
        paginatedSection
      ) : (
        infiniteSection
      )}
    </div>
  );
};

export default MetricListSection;
