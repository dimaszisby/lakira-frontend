import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { MetricPreviewVM } from "@/features/metrics";
import MetricForm from "@/features/metrics/components/MetricForm";
import MetricTable from "@/features/metrics/components/MetricTable";
import { useDeleteMetric, useMetricsListPaginationViaCursor } from "@/features/metrics/hooks";
import type { MetricSortParamViaCursor } from "@/features/metrics/sort";
import {
  DEFAULT_METRIC_SORT,
  isSortableColumn,
  METRICS_PAGE_SIZE,
  nextSortForColumn,
  parseSort,
} from "@/features/metrics/sort";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import Card, { CardHeader, CardTitle } from "@/src/components/ui/Card";
import Button from "@/ui/Button";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SekeletonLoader";

interface MetricCategorySectionProps {
  categoryId: string;
}

const MetricListSection: React.FC<MetricCategorySectionProps> = ({ categoryId }) => {
  const router = useRouter();

  const PAGE_SIZE = METRICS_PAGE_SIZE;
  const [sort, setSort] = useState<MetricSortParamViaCursor>(DEFAULT_METRIC_SORT);
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);

  // * Search
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 350);
  const [filterName] = useState<string>("");
  const [filterCategory] = useState<string>(categoryId);

  const params = useMemo(() => {
    const p: {
      limit: number;
      sort: MetricSortParamViaCursor;
      q?: string;
      filter?: { name?: string; categoryId?: string };
    } = { limit: PAGE_SIZE, sort };

    if (debouncedQ) p.q = debouncedQ;

    const f: { name?: string; categoryId?: string } = {};
    if (filterName) f.name = filterName;
    if (filterCategory) f.categoryId = filterCategory;
    if (Object.keys(f).length) p.filter = f;

    return p;
  }, [PAGE_SIZE, sort, debouncedQ, filterName, filterCategory]);

  // Hooks
  const pages = useMetricsListPaginationViaCursor({
    ...params,
    enabled: true,
  });

  // Sorting
  const onColumnSort = useMemo(
    () => makeOnColumnSort(isSortableColumn, nextSortForColumn, setSort),
    [setSort],
  );

  // * Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricPreviewVM | null>(null);
  const { deleteMetric } = useDeleteMetric();

  // * Handlers
  // Row Click Handler
  const handleRowClick = useCallback(
    (met: MetricPreviewVM) => router.push(`/metrics/${met.id}`),
    [router],
  );

  // Create Handler
  const handleCreateClick = useCallback(() => {
    setEditingMetric(null); // No log = create mode
    setModalOpen(true);
  }, []);

  // Edit Handler
  const handleEditClick = useCallback(() => {
    setEditingMetric(editingMetric);
    setModalOpen(true);
  }, [setEditingMetric, editingMetric]);

  // Delete handler
  const deleteMetricAsync = useCallback(
    async (metric: MetricPreviewVM) => {
      try {
        await deleteMetric(metric.id);
      } catch (error) {
        console.error("Failed to delete metric:", error);
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

  // Computed values
  // const errorMsg = deleteError?.message;
  const loading = pages.isFetching && pages.items.length === 0;
  const empty = pages.items.length === 0;

  return (
    <>
      {/* Log Form Modal (handles add/edit/delete) */}
      {modalOpen ? (
        <MetricForm
          initialMetric={null}
          onClose={() => {
            setModalOpen(false);
            setEditingMetric(null);
          }}
        />
      ) : null}

      <Card>
        <CardHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-y-2">
          <CardTitle className="text-h3">Metrics</CardTitle>
          <section className="flex flex-row items-center gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              isLoading={pages.isFetching ? !!pages.items.length : undefined}
              placeholder="Search by name…"
              className="flex-1"
            />

            <Button onClick={handleCreateClick} aria-label="Create New Metric">
              Add Metrics
            </Button>
          </section>
        </CardHeader>

        {/* Pagination Placeholder (unchanged) */}
        {loading ? (
          <SkeletonLoader count={10} className="h-10" />
        ) : empty ? (
          <EmptyDataIndicator
            title="No Data Available"
            description="You haven't created any data yet."
            tooltip="Create your first data"
          />
        ) : (
          <>
            <MetricTable
              metrics={pages.items}
              sortBy={sortField}
              sortOrder={sortDir}
              onSort={(col) => onColumnSort(String(col))}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onRowClick={handleRowClick}
            />

            {/**Pagination Segment */}
            <Pagination
              page={pages.page}
              pageSize={PAGE_SIZE}
              total={pages.totalCount}
              onChange={pages.setPage}
              canPrev={pages.canPrev}
              canNext={pages.canNext}
            />
          </>
        )}
      </Card>
    </>
  );
};

export default MetricListSection;
