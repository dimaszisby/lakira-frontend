"use client";

import React, { memo, useCallback, useMemo, useState } from "react";

import MetricLogFormModal from "@/components/pages/logs/LogFormModal";
import LogTable from "@/components/pages/logs/LogTable";
import {
  useCreateMetricLogDummy,
  useDeleteMetricLog,
  useMetricLogsListPaginationViaCursor,
} from "@/features/metricLogs/hooks";
import type {
  MetricLogFilterViaCursor,
  MetricLogSortParamViaCursor,
} from "@/features/metricLogs/sort";
import { nextSortForColumn, parseSort } from "@/features/metricLogs/sort";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import PrimaryButton from "@/ui/PrimaryButton";
import SearchInput from "@/ui/SearchInput";
import SectionCard from "@/ui/SectionCard";
import SkeletonLoader from "@/ui/SekeletonLoader";

export const MetricLogsSectionBase = ({ metricId }: { metricId: string }) => {
  // * Contants
  const PAGE_SIZE = 50;
  const [sort, setSort] = useState<MetricLogSortParamViaCursor>("-createdAt");
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);

  // * Search
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 350);
  const [filterName] = useState<string>("");
  const [filterMetric] = useState<string>(metricId);

  const params = useMemo(() => {
    const p: {
      limit: number;
      sort: MetricLogSortParamViaCursor;
      q?: string;
      filter?: MetricLogFilterViaCursor;
    } = { limit: PAGE_SIZE, sort };

    if (debouncedQ) p.q = debouncedQ;

    const f: MetricLogFilterViaCursor = {};
    if (filterName) f.name = filterName;
    if (filterMetric) f.metricId = filterMetric;
    if (Object.keys(f).length) p.filter = f;

    return p;
  }, [PAGE_SIZE, sort, debouncedQ, filterName, filterMetric]);

  // Hook consumtion based on mode
  const pages = useMetricLogsListPaginationViaCursor({
    ...params,
    enabled: true,
  });

  const onColumnSort = useCallback((column: string) => {
    if (
      column === "createdAt" ||
      column === "updatedAt" ||
      column === "logValue" ||
      column === "loggedAt"
    ) {
      setSort((cur) => nextSortForColumn(cur, column));
    }
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MetricLogResponseDTO | null>(null);

  // Use the new useMetricLogs with pagination
  const { deleteMetricLog } = useDeleteMetricLog();

  // * Handlers
  const handleEditLog = useCallback((log: MetricLogResponseDTO) => {
    setSelectedLog(log);
    setModalOpen(true);
  }, []);

  const handleDelete = async (log: MetricLogResponseDTO) => {
    try {
      await deleteMetricLog(log.id);
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  // * Dummy Metrics
  const { createMetricLogDummy } = useCreateMetricLogDummy();
  const onDummyDataSubmit = async () => {
    try {
      await createMetricLogDummy({
        count: 5,
        metricId: metricId,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // * Handlers
  const handleRowClick = (log: MetricLogResponseDTO) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const handleAddLogClick = () => {
    setSelectedLog(null); // No log = create mode
    setModalOpen(true);
  };

  // Derived
  const loading = pages.isFetching && pages.items.length === 0;
  const empty = pages.items.length === 0;

  return (
    <>
      {/* Log Form Modal (handles add/edit/delete) */}
      <MetricLogFormModal
        metricId={metricId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialLog={selectedLog}
      />

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
              onClick={void onDummyDataSubmit}
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
                onEdit={handleEditLog}
                onDelete={void handleDelete}
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
