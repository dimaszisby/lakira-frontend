"use client";

const DUMMY_FEATURE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS === "true";

import { useRouter } from "next/navigation";
import { Plus } from "phosphor-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Card, { CardHeader } from "@/components/ui/Card";
import ListModeToggle from "@/components/ui/ListModeToggle";
import MetricTable from "@/features/metrics/components/MetricTable";
import { mobileColumns } from "@/features/metrics/components/table-config";
import {
  useCreateMetricDummy,
  useDeleteMetric,
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
import { LIST_MODE_DESKTOP_MQ } from "@/hooks/useListMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { metricRoutes } from "@/lib/routes";
import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import { handleApiError } from "@/services/api/handleApiError";
import { useMetricListSearchState } from "@/src/features/metrics/hooks/list.search-state";
import Button from "@/ui/Button";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SkeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

type MetricsPageClientProps = {
  initialParams: MetricListSearchParams;
};

const MetricsPageClient = ({ initialParams }: MetricsPageClientProps) => {
  const router = useRouter();
  const { params, replaceParams } = useMetricListSearchState(initialParams);
  const isDesktopViewport = useMediaQuery(LIST_MODE_DESKTOP_MQ);

  const limit = params.limit ?? METRICS_PAGE_SIZE;
  const sort: MetricSortParamViaCursor = params.sort ?? DEFAULT_METRIC_SORT;
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);
  const isPagesMode = params.mode === "pages";

  const [searchValue, setSearchValue] = useState(() => params.q ?? "");
  const debouncedSearch = useDebouncedValue(searchValue, 350);

  const handleParamsChange = useCallback(
    (next: Partial<MetricListSearchParams>) => {
      replaceParams({
        ...params,
        ...next,
        limit,
      });
    },
    [limit, params, replaceParams],
  );

  const listParams = useMemo(() => {
    const base: {
      limit: number;
      sort: MetricSortParamViaCursor;
      q?: string;
    } = { limit, sort };
    if (params.q) base.q = params.q;
    return base;
  }, [limit, sort, params.q]);

  const infinite = useMetricInfiniteViaCursor({ ...listParams, enabled: !isPagesMode });
  const pages = useMetricsListPaginationViaCursor({ ...listParams, enabled: isPagesMode });

  useEffect(() => {
    if ((params.q ?? "") === debouncedSearch) return;
    handleParamsChange({ q: debouncedSearch ?? "", page: 1 });
  }, [debouncedSearch, handleParamsChange, params.q]);

  const {
    createMetricDummy,
    isPending: isCreatingDummy,
    error: createDummyError,
  } = useCreateMetricDummy();

  const { deleteMetric, error: deleteError } = useDeleteMetric();

  const handleModeChange = useCallback(
    (mode: "pages" | "scroll") => {
      handleParamsChange({ mode, page: 1 });
    },
    [handleParamsChange],
  );

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), []);
  const handleClearSearch = useCallback(() => setSearchValue(""), []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      pages.setPage(nextPage);
      handleParamsChange({ page: nextPage });
    },
    [handleParamsChange, pages],
  );

  const onColumnSort = useMemo(
    () =>
      makeOnColumnSort(isSortableColumn, nextSortForColumn, (updater) => {
        const nextSort = updater(sort);
        handleParamsChange({ sort: nextSort, page: 1 });
      }),
    [handleParamsChange, sort],
  );

  const handleRowClick = useCallback(
    (metric: MetricPreviewVM) => router.push(metricRoutes.detail(metric.id)),
    [router],
  );

  const handleEditMetric = useCallback(
    (metric: MetricPreviewVM) => router.push(metricRoutes.modal.edit(metric.id)),
    [router],
  );

  const handleAddMetric = useCallback(() => {
    router.push(metricRoutes.modal.new());
  }, [router]);

  const deleteMetricAsync = useCallback(
    async (metric: MetricPreviewVM) => {
      try {
        await deleteMetric(metric.id);
      } catch (error) {
        console.error("Error deleting metric:", error);
      }
    },
    [deleteMetric],
  );

  const handleDeleteClick = useCallback(
    (metric: MetricPreviewVM) => {
      void deleteMetricAsync(metric);
    },
    [deleteMetricAsync],
  );

  const dummyMetricAsync = useCallback(async () => {
    if (!DUMMY_FEATURE_ENABLED) return;
    try {
      await createMetricDummy({ count: 50 });
    } catch (error) {
      const msgs = handleApiError(error as Error);
      console.error("Mutation error:", msgs);
    }
  }, [createMetricDummy]);

  const handleDummyCreateClick = useCallback(() => {
    void dummyMetricAsync();
  }, [dummyMetricAsync]);

  const handleFetchNextPage = useCallback(() => {
    if (infinite.hasNextPage && !infinite.isFetchingNextPage) {
      void infinite.fetchNextPage();
    }
  }, [infinite]);

  const currentItems = useMemo(
    () => (isPagesMode ? pages.items : infinite.items),
    [isPagesMode, pages.items, infinite.items],
  );

  useEffect(() => {
    currentItems.slice(0, 10).forEach((item) => {
      router.prefetch(metricRoutes.detail(item.id));
    });
  }, [currentItems, router]);

  const rawErrorMsg = createDummyError?.message || deleteError?.message || "";
  const errorMsg = rawErrorMsg ? sanitizeErrorMessage(rawErrorMsg) : "";

  const isInitialLoading = isPagesMode
    ? pages.isFetching && pages.items.length === 0
    : infinite.isLoading && infinite.items.length === 0;
  const isEmpty = !isInitialLoading
    ? isPagesMode
      ? pages.items.length === 0
      : infinite.items.length === 0
    : false;

  const paginatedTableVariant: "desktop" | "mobile" = isDesktopViewport ? "desktop" : "mobile";

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader>
          <p className="text-sm font-medium text-ink-tertiary">Library</p>
          <h1 className="text-3xl font-bold text-ink-emphasis">My Metrics</h1>
        </CardHeader>
        <ListModeToggle
          value={params.mode}
          onChange={handleModeChange}
          className="self-start sm:self-auto"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          isLoading={
            isPagesMode
              ? pages.isFetching && !!pages.items.length
              : infinite.isFetching && !infinite.isFetchingNextPage
          }
          placeholder="Search by name…"
          className="flex-1"
        />

        <div className="flex flex-wrap gap-2">
          {DUMMY_FEATURE_ENABLED ? (
            <Button variant="secondary" onClick={handleDummyCreateClick} aria-label="Add dummy">
              {isCreatingDummy ? "Saving..." : "Add Dummy"}
            </Button>
          ) : null}

          <Button
            variant="primary"
            onClick={handleAddMetric}
            aria-label="Create Metric"
            leftIcon={<Plus size={20} />}
          >
            Create Metric
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <p role="alert" className="text-sm text-status-error">
          {errorMsg}
        </p>
      ) : null}
    </div>
  );

  const paginatedSection = (
    <div className="flex flex-col gap-4">
      {paginatedTableVariant === "mobile" ? (
        <SortChipGroup
          sortBy={sortField as keyof MetricPreviewVM}
          sortOrder={sortDir}
          onSort={(key) => onColumnSort(String(key))}
          columns={mobileColumns}
          className="w-full"
        />
      ) : null}

      <MetricTable
        metrics={pages.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
        variant={paginatedTableVariant}
      />

      <Pagination
        page={pages.page}
        pageSize={limit}
        total={pages.totalCount}
        onChange={handlePageChange}
        canPrev={pages.canPrev}
        canNext={pages.canNext}
      />
    </div>
  );

  const infiniteSection = (
    <div className="flex flex-col gap-4">
      <SortChipGroup
        sortBy={sortField as keyof MetricPreviewVM}
        sortOrder={sortDir}
        onSort={(key) => onColumnSort(String(key))}
        columns={mobileColumns}
        className="w-full"
      />

      <MetricTable
        metrics={infinite.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
        variant="mobile"
      />

      {infinite.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            onClick={handleFetchNextPage}
            disabled={infinite.isFetchingNextPage}
            aria-label="Load more data"
          >
            {infinite.isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {infinite.isFetchingNextPage ? "Loading more metrics" : ""}
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col gap-6">
      {header}

      {isInitialLoading ? (
        <SkeletonLoader count={10} className="h-10" />
      ) : isEmpty ? (
        <EmptyDataIndicator
          title="No Data Available"
          description="You haven't created any data yet."
          tooltip="Create your first data"
        />
      ) : isPagesMode ? (
        paginatedSection
      ) : (
        infiniteSection
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full">
      {isDesktopViewport ? (
        <Card size="sm" variant="primary" className="flex flex-col gap-6">
          {content}
        </Card>
      ) : (
        <div className="flex flex-col gap-6">{content}</div>
      )}
    </div>
  );
};

export default MetricsPageClient;
