"use client";

const DUMMY_FEATURE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS === "true";

import { useRouter } from "next/navigation";
import { Plus } from "phosphor-react";
import { useCallback, useMemo, useState } from "react";

import { withAuth } from "@/components/hoc/withAuth";
import Card, { CardHeader } from "@/components/ui/Card";
import ListModeToggle from "@/components/ui/ListModeToggle";
import { fromPreview } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import MetricTable from "@/features/metrics/components/MetricTable";
import { mobileColumns } from "@/features/metrics/components/table-config";
import {
  useCreateMetricDummy,
  useDeleteMetric,
  useMetricInfiniteViaCursor,
  useMetricsListPaginationViaCursor,
} from "@/features/metrics/hooks";
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
import { LIST_MODE_DESKTOP_MQ, useListMode } from "@/hooks/useListMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SekeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

export const MetricsPage = () => {
  const router = useRouter();
  const { mode, setMode, isPages } = useListMode("metricsListMode");
  const isDesktopViewport = useMediaQuery(LIST_MODE_DESKTOP_MQ);

  // constants
  const PAGE_SIZE = METRICS_PAGE_SIZE;
  const [sort, setSort] = useState<MetricSortParamViaCursor>(DEFAULT_METRIC_SORT);
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);

  // * Search
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 350);
  const [filterName] = useState<string>("");

  const params = useMemo(() => {
    const p: {
      limit: number;
      sort: MetricSortParamViaCursor;
      q?: string;
      filter?: { name: string };
    } = { limit: PAGE_SIZE, sort };

    if (debouncedQ) p.q = debouncedQ;
    if (filterName) p.filter = { name: filterName };

    return p;
  }, [PAGE_SIZE, sort, debouncedQ, filterName]);

  // Hook consumtion based on mode
  const infinite = useMetricInfiniteViaCursor({ ...params, enabled: !isPages });
  const pages = useMetricsListPaginationViaCursor({
    ...params,
    enabled: isPages,
  });
  const {
    items: infiniteItems,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
  } = infinite;
  const {
    items: paginatedItems,
    page,
    setPage,
    totalCount,
    canPrev,
    canNext,
    isFetching: isPaginatedFetching,
  } = pages;

  const onColumnSort = useMemo(
    () => makeOnColumnSort(isSortableColumn, nextSortForColumn, setSort),
    [setSort],
  );

  // * Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricPreviewVM | null>(null);

  // * Mutations
  const {
    createMetricDummy,
    isPending: isCreatingDummy,
    error: createDummyError,
  } = useCreateMetricDummy();

  const { deleteMetric, error: deleteError } = useDeleteMetric();

  // * Handlers
  const handleRowClick = useCallback(
    (met: MetricPreviewVM) => router.push(`/metrics/${met.id}`),
    [router],
  );

  const handleAddMetric = () => {
    setEditingMetric(null);
    setModalOpen(true);
  };

  const handleEditMetric = useCallback((metric: MetricPreviewVM) => {
    setEditingMetric(metric);
    setModalOpen(true);
  }, []);

  // Delete handler
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

  // Dummy Create Handler
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

  // Infinite scroll handler
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Derived
  const rawErrorMsg = createDummyError?.message || deleteError?.message || "";
  const errorMsg = rawErrorMsg ? sanitizeErrorMessage(rawErrorMsg) : "";
  const isInitialLoading = isPages
    ? isPaginatedFetching && paginatedItems.length === 0
    : isInfiniteLoading && infiniteItems.length === 0;
  const isEmpty =
    !isInitialLoading && (isPages ? paginatedItems.length === 0 : infiniteItems.length === 0);

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardHeader>
          <p className="text-sm font-medium text-ink-tertiary">Library</p>
          <h1 className="text-3xl font-bold text-ink-emphasis">My Metrics</h1>
        </CardHeader>
        <ListModeToggle value={mode} onChange={setMode} className="self-start sm:self-auto" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          isLoading={
            isPages
              ? isPaginatedFetching && !!paginatedItems.length
              : infinite.isFetching && !isFetchingNextPage
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

  const paginatedTableVariant: "desktop" | "mobile" = isDesktopViewport ? "desktop" : "mobile";

  const renderPaginatedSection = () => (
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
        metrics={paginatedItems}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
        variant={paginatedTableVariant}
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={totalCount}
        onChange={setPage}
        canPrev={canPrev}
        canNext={canNext}
      />
    </div>
  );

  const renderInfiniteSection = () => (
    <div className="flex flex-col gap-4">
      <SortChipGroup
        sortBy={sortField as keyof MetricPreviewVM}
        sortOrder={sortDir}
        onSort={(key) => onColumnSort(String(key))}
        columns={mobileColumns}
        className="w-full"
      />

      <MetricTable
        metrics={infiniteItems}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditMetric}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
        variant="mobile"
      />

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            onClick={handleFetchNextPage}
            disabled={isFetchingNextPage}
            aria-label="Load more data"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {isFetchingNextPage ? "Loading more metrics" : ""}
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
      ) : isPages ? (
        renderPaginatedSection()
      ) : (
        renderInfiniteSection()
      )}
    </div>
  );

  return (
    <>
      <div className="mx-auto w-full">
        {isDesktopViewport ? (
          <Card size="sm" variant="primary" className="flex flex-col gap-6">
            {content}
          </Card>
        ) : (
          <div className="flex flex-col gap-6">{content}</div>
        )}
      </div>

      {modalOpen ? (
        <MetricForm
          initialMetric={editingMetric ? fromPreview(editingMetric) : null}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </>
  );
};

const AuthMetricsPage = withAuth(MetricsPage);
export default AuthMetricsPage;
