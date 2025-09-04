"use client";

import React, { useCallback, useMemo, useState } from "react";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import SectionCard from "@/src/components/ui/SectionCard";
import SkeletonLoader from "@/src/components/ui/SekeletonLoader";
import { Pagination } from "@/src/components/ui/Pagination";
import LogTable from "../../logs/LogTable";
import MetricLogFormModal from "../../logs/LogFormModal";
import {
  useCreateMetricLogDummy,
  useDeleteMetricLog,
  useMetricLogsListPaginationViaCursor,
} from "@/src/features/metricLogs/hooks";
import { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import EmptyDataIndicator from "@/src/components/ui/EmptyDataIndicator";
import {
  MetricLogFilterViaCursor,
  MetricLogSortParamViaCursor,
  nextSortForColumn,
  parseSort,
} from "@/src/features/metricLogs/sort";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import SearchInput from "@/src/components/ui/SearchInput";

interface MetricLogSectionProps {
  metricId: string;
}

const MetricLogsSection: React.FC<MetricLogSectionProps> = ({ metricId }) => {
  // * Contants
  const PAGE_SIZE = 50;
  const [sort, setSort] = useState<MetricLogSortParamViaCursor>("-createdAt");
  const { field: sortField, dir: sortDir } = useMemo(
    () => parseSort(sort),
    [sort]
  );

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

    console.log(`----- [View]: Filter`, p.filter);
    console.log(`----- [View]: Limit`, p.limit);

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
  const [selectedLog, setSelectedLog] = useState<MetricLogResponseDTO | null>(
    null
  );

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
          <div className="flex bg-items-center justify-between space-x-4 mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              isLoading={pages.isFetching && !!pages.items.length}
              placeholder="Search by log value…"
              className="flex-1"
            />

            <PrimaryButton
              onClick={onDummyDataSubmit}
              ariaLabel="Generate Logs"
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                onDelete={handleDelete}
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

export default MetricLogsSection;
