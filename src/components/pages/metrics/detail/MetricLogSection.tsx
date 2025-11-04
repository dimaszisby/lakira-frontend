"use client";

import React, { memo, useCallback, useMemo, useState } from "react";

import LogTable from "@/features/metric-logs/components/LogTable";
import {
  useCreateMetricLogDummy,
  useDeleteMetricLog,
  useMetricLogListCursorPage,
} from "@/features/metric-logs/hooks/index";
import type { MetricLogFilter, MetricLogSortParam } from "@/features/metric-logs/sort";
import {
  DEFAULT_METRIC_LOG_SORT,
  isSortableColumn,
  nextSortForColumn,
  parseSort,
} from "@/features/metric-logs/sort";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MetricLogForm from "@/src/features/metric-logs/components/LogForm";
import { makeOnColumnSort } from "@/src/lib/sort/makeOnColumnSort";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import PrimaryButton from "@/ui/PrimaryButton";
import SearchInput from "@/ui/SearchInput";
import SectionCard from "@/ui/SectionCard";
import SkeletonLoader from "@/ui/SekeletonLoader";

export const MetricLogsSectionBase = ({ metricId }: { metricId: string }) => {
  // * Contants
  const PAGE_SIZE = 50;
  const [sort, setSort] = useState<MetricLogSortParam>(DEFAULT_METRIC_LOG_SORT);
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);

  // * Search
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 350);
  const [filterName] = useState<string>("");
  const [filterMetric] = useState<string>(metricId);

  const params = useMemo(() => {
    const p: {
      limit: number;
      sort: MetricLogSortParam;
      q?: string;
      filter?: MetricLogFilter;
    } = { limit: PAGE_SIZE, sort };

    if (debouncedQ) p.q = debouncedQ;

    const f: MetricLogFilter = {};
    if (filterName) f.name = filterName;
    if (filterMetric) f.metricId = filterMetric;
    if (Object.keys(f).length) p.filter = f;

    return p;
  }, [PAGE_SIZE, sort, debouncedQ, filterName, filterMetric]);

  // Hook consumtion based on mode
  const pages = useMetricLogListCursorPage({
    ...params,
    enabled: true,
  });

  // Sort Handler
  const onColumnSort = useMemo(
    () => makeOnColumnSort(isSortableColumn, nextSortForColumn, setSort),
    [setSort],
  );

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MetricLogVM | null>(null);

  // * Mutations
  const { deleteMetricLog } = useDeleteMetricLog();
  const { createMetricLogDummy } = useCreateMetricLogDummy();

  // * Handlers
  // Row Click Handler
  const handleRowClick = (log: MetricLogVM) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  // Add Log Handler
  const handleAddLogClick = () => {
    setSelectedLog(null); // No log = create mode
    setModalOpen(true);
  };

  // Edit Log Handler
  const handleEditLogClick = useCallback((log: MetricLogVM) => {
    setSelectedLog(log);
    setModalOpen(true);
  }, []);

  // Delete Log Handler
  const deleteLogAsync = useCallback(
    async (log: MetricLogVM) => {
      try {
        await deleteMetricLog(log.id);
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    },
    [deleteMetricLog],
  );

  const handleDeleteClick = useCallback(
    (log: MetricLogVM) => {
      void deleteLogAsync(log);
    },
    [deleteLogAsync],
  );

  // Dummy Data Handler
  const dummyLogAsync = useCallback(async () => {
    try {
      await createMetricLogDummy({
        count: 5,
        metricId: metricId,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }, [createMetricLogDummy, metricId]);

  const handleDummyCreateClick = useCallback(() => {
    void dummyLogAsync();
  }, [dummyLogAsync]);

  // Derived
  const loading = pages.isFetching && pages.items.length === 0;
  const empty = pages.items.length === 0;

  return (
    <>
      {/* Log Form Modal */}
      {modalOpen ? (
        <MetricLogForm
          metricId={metricId}
          onClose={() => setModalOpen(false)}
          initialLog={selectedLog}
        />
      ) : null}

      <SectionCard
        title="Logs"
        className="mb-8"
        headerComponent={
          <div className="bg-items-center mb-4 flex justify-between space-x-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              isLoading={pages.isFetching ? !!pages.items.length : undefined}
              placeholder="Search by log value…"
              className="flex-1"
            />

            <PrimaryButton
              onClick={handleDummyCreateClick}
              ariaLabel="Generate Logs"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Generate Dummy
            </PrimaryButton>

            <PrimaryButton onClick={handleAddLogClick}>Add Logs</PrimaryButton>
          </div>
        }
      >
        <>
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
              <LogTable
                logs={pages.items}
                sortBy={sortField}
                sortOrder={sortDir}
                onSort={(col) => onColumnSort(String(col))}
                onEdit={handleEditLogClick}
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
        </>
      </SectionCard>
    </>
  );
};
MetricLogsSectionBase.displayName = "MetricLogsSection";

const MetricLogsSection = memo(MetricLogsSectionBase);
MetricLogsSection.displayName = "MetricLogsSection";
export default MetricLogsSection;
