"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import LogTable from "@/features/metric-logs/components/LogTable";
import { mobileColumns } from "@/features/metric-logs/components/table-config";
import {
  useCreateMetricLogDummy,
  useDeleteMetricLog,
  useMetricLogListCursorPage,
} from "@/features/metric-logs/hooks";
import type { MetricLogListSearchParams } from "@/features/metric-logs/listSearchParams";
import {
  DEFAULT_METRIC_LOG_SORT,
  isSortableColumn,
  nextSortForColumn,
  parseSort,
} from "@/features/metric-logs/sort";
import { useMetricLogSearchState } from "@/features/metric-logs/useMetricLogSearchState";
import type { MetricLogVM } from "@/features/metric-logs/view-models";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isDummyActionsEnabled } from "@/lib/env";
import { metricRoutes } from "@/lib/routes";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import Button from "@/ui/Button";
import Card, { CardHeader, CardTitle } from "@/ui/Card";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SkeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

import { useMetricDetail } from "../../_components/MetricDetailContext";

const DEFAULT_PAGE_SIZE = 50;

type MetricLogsClientProps = {
  initialParams: MetricLogListSearchParams;
};

const MetricLogsClient = ({ initialParams }: MetricLogsClientProps) => {
  const router = useRouter();
  const { metricId } = useMetricDetail();
  const { params, replaceParams } = useMetricLogSearchState(metricId, initialParams);

  const [searchValue, setSearchValue] = useState(params.q ?? "");
  const debouncedSearch = useDebouncedValue(searchValue, 350);

  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const sortParam = params.sort ?? DEFAULT_METRIC_LOG_SORT;
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sortParam), [sortParam]);

  const queryParams = useMemo(() => {
    const base: {
      limit: number;
      sort: typeof sortParam;
      q?: string;
      filter: { metricId: string };
    } = {
      limit,
      sort: sortParam,
      filter: { metricId },
    };

    if (params.q) base.q = params.q;
    return base;
  }, [limit, sortParam, params.q, metricId]);

  const pages = useMetricLogListCursorPage({ ...queryParams, enabled: true });

  useEffect(() => {
    const nextQ = debouncedSearch.trim();
    if ((params.q ?? "") === nextQ) return;
    replaceParams({ ...params, q: nextQ, page: 1 });
  }, [debouncedSearch, params, replaceParams]);

  useEffect(() => {
    if (pages.page === params.page) return;
    pages.setPage(params.page);
  }, [pages.page, params.page, pages.setPage]);

  const handleParamsChange = useCallback(
    (next: Partial<MetricLogListSearchParams>) => {
      replaceParams({ ...params, ...next });
    },
    [params, replaceParams],
  );

  const onColumnSort = useMemo(
    () =>
      makeOnColumnSort(isSortableColumn, nextSortForColumn, (column) => {
        if (!isSortableColumn(column)) return;
        const nextSort = nextSortForColumn(sortParam, column);
        handleParamsChange({ sort: nextSort, page: 1 });
      }),
    [handleParamsChange, sortParam],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      pages.setPage(nextPage);
      handleParamsChange({ page: nextPage });
    },
    [handleParamsChange, pages],
  );

  const baseLogsPath = metricRoutes.logs(metricId);

  const handleAddLogClick = useCallback(() => {
    router.push(`${baseLogsPath}/new`);
  }, [baseLogsPath, router]);

  const handleEditLogClick = useCallback(
    (log: MetricLogVM) => {
      router.push(`${baseLogsPath}/${log.id}`);
    },
    [baseLogsPath, router],
  );

  const { deleteMetricLog } = useDeleteMetricLog();
  const deleteLogAsync = useCallback(
    async (log: MetricLogVM) => {
      try {
        await deleteMetricLog({ logId: log.id, metricId });
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    },
    [deleteMetricLog, metricId],
  );

  const handleDeleteClick = useCallback(
    (log: MetricLogVM) => {
      void deleteLogAsync(log);
    },
    [deleteLogAsync],
  );

  const { createMetricLogDummy } = useCreateMetricLogDummy();
  const dummyLogAsync = useCallback(async () => {
    if (!isDummyActionsEnabled) return;
    try {
      await createMetricLogDummy({ count: 5, metricId });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }, [createMetricLogDummy, metricId]);

  const handleDummyCreateClick = useCallback(() => {
    void dummyLogAsync();
  }, [dummyLogAsync]);

  const loading = pages.isFetching && pages.items.length === 0;
  const empty = pages.items.length === 0;

  return (
    <Card>
      <CardHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-y-4">
        <section className="flex flex-row items-center gap-4">
          <CardTitle className="text-h3">Logs</CardTitle>
          {isDummyActionsEnabled ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDummyCreateClick}
              aria-label="Generate Dummy"
            >
              Generate Dummy
            </Button>
          ) : null}
        </section>

        <section className="flex flex-row items-center gap-4">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            onClear={() => setSearchValue("")}
            isLoading={pages.isFetching ? !!pages.items.length : undefined}
            placeholder="Search logs…"
          />
          <Button variant="primary" onClick={handleAddLogClick} aria-label="Create New Log">
            Add Logs
          </Button>
        </section>
      </CardHeader>

      {loading ? (
        <SkeletonLoader count={10} className="h-10" />
      ) : empty ? (
        <EmptyDataIndicator
          title="No Data Available"
          description="You haven't created any logs yet."
          tooltip="Create your first log"
        />
      ) : (
        <>
          <SortChipGroup
            sortBy={sortField as keyof MetricLogVM}
            sortOrder={sortDir}
            onSort={(key) => onColumnSort(String(key))}
            columns={mobileColumns}
            className="w-full"
          />

          <LogTable
            logs={pages.items}
            sortBy={sortField}
            sortOrder={sortDir}
            onSort={(col) => onColumnSort(String(col))}
            onEdit={handleEditLogClick}
            onDelete={handleDeleteClick}
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
      )}
    </Card>
  );
};

export default MetricLogsClient;
