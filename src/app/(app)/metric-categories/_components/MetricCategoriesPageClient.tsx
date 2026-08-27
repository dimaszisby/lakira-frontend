"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import MetricCategoryTable from "@/features/metric-categories/components/MetricCategoryTable";
import { mobileColumns } from "@/features/metric-categories/components/table-config";
import {
  useCreateMetricCategoryDummy,
  useDeleteMetricCategory,
  useMetricCategoryListCursorInfinite,
} from "@/features/metric-categories/hooks";
import { useMetricCategoryListCursorPagination } from "@/features/metric-categories/hooks/list.cursor-page.query";
import type { MetricCategoryListSearchParams } from "@/features/metric-categories/listSearchParams";
import { encodeCategoryReturnParams } from "@/features/metric-categories/listSearchParams";
import {
  DEFAULT_METRIC_CATEGORY_SORT,
  isSortableColumn,
  nextSortForColumn,
  parseSort,
} from "@/features/metric-categories/sort";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LIST_MODE_DESKTOP_MQ } from "@/hooks/useListMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { isDummyActionsEnabled } from "@/lib/env";
import { metricCategoryRoutes } from "@/lib/routes";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import { useMetricCategorySearchState } from "@/src/features/metric-categories/hooks/useMetricCategorySearchState";
import Button from "@/ui/Button";
import Card, { CardHeader, CardTitle } from "@/ui/Card";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import ListModeToggle from "@/ui/ListModeToggle";
import { Pagination } from "@/ui/Pagination";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SkeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

const PAGE_SIZE = 50;

type MetricCategoriesPageClientProps = {
  initialParams: MetricCategoryListSearchParams;
};

const MetricCategoriesPageClient = ({ initialParams }: MetricCategoriesPageClientProps) => {
  const router = useRouter();
  const isDesktopViewport = useMediaQuery(LIST_MODE_DESKTOP_MQ);
  const { params, replaceParams, mode } = useMetricCategorySearchState(initialParams);
  const isPages = mode === "pages";

  const [searchValue, setSearchValue] = useState(() => params.q ?? "");
  const debouncedSearch = useDebouncedValue(searchValue, 350);

  const limit = params.limit ?? PAGE_SIZE;
  const sortParam = params.sort ?? DEFAULT_METRIC_CATEGORY_SORT;
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sortParam), [sortParam]);

  const queryParams = useMemo(() => {
    const base: {
      limit: number;
      sort: typeof sortParam;
      q?: string;
    } = { limit, sort: sortParam };
    if (params.q) base.q = params.q;
    return base;
  }, [limit, sortParam, params.q]);

  const infinite = useMetricCategoryListCursorInfinite({ ...queryParams, enabled: !isPages });
  const pages = useMetricCategoryListCursorPagination({ ...queryParams, enabled: isPages });

  useEffect(() => {
    const nextQ = debouncedSearch.trim();
    if ((params.q ?? "") === nextQ) return;
    replaceParams({ ...params, q: nextQ, page: 1 });
  }, [debouncedSearch, params, replaceParams]);

  const handleParamsChange = useCallback(
    (next: Partial<MetricCategoryListSearchParams>) => {
      replaceParams({ ...params, ...next });
    },
    [params, replaceParams],
  );

  const handleModeChange = useCallback(
    (nextMode: "pages" | "scroll") => {
      handleParamsChange({ mode: nextMode, page: 1 });
    },
    [handleParamsChange],
  );

  const onColumnSort = useMemo(
    () =>
      makeOnColumnSort(isSortableColumn, nextSortForColumn, (updater) => {
        const nextSort = updater(sortParam);
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

  const handleRowClick = useCallback(
    (category: MetricCategoryVM) => {
      const returnParams = encodeCategoryReturnParams(params);
      router.push(metricCategoryRoutes.detail(category.id, { returnParams }));
    },
    [params, router],
  );

  const { deleteMetricCategory } = useDeleteMetricCategory();
  const deleteCategoryAsync = useCallback(
    async (category: MetricCategoryVM) => {
      try {
        await deleteMetricCategory(category.id);
      } catch (error) {
        console.error("Error deleting metric category:", error);
      }
    },
    [deleteMetricCategory],
  );

  const handleDeleteClick = useCallback(
    (category: MetricCategoryVM) => {
      void deleteCategoryAsync(category);
    },
    [deleteCategoryAsync],
  );

  const {
    createCategoryDummy,
    isPending: isCreatingDummy,
    error: createDummyError,
  } = useCreateMetricCategoryDummy();

  const dummyMetricAsync = useCallback(async () => {
    if (!isDummyActionsEnabled) return;
    try {
      await createCategoryDummy({ count: 5 });
    } catch (error) {
      console.error("Mutation error:", error);
    }
  }, [createCategoryDummy]);

  const handleDummyCreateClick = useCallback(() => {
    void dummyMetricAsync();
  }, [dummyMetricAsync]);

  const handleAddCategory = useCallback(() => {
    router.push(metricCategoryRoutes.modal.new());
  }, [router]);

  const handleEditCategory = useCallback(
    (category: MetricCategoryVM) => {
      router.push(metricCategoryRoutes.modal.edit(category.id));
    },
    [router],
  );

  const isInitialLoading = isPages
    ? pages.isFetching && pages.items.length === 0
    : infinite.isLoading && infinite.items.length === 0;
  const isEmpty = !isInitialLoading
    ? isPages
      ? pages.items.length === 0
      : infinite.items.length === 0
    : false;
  const rawErrorMsg = createDummyError?.message ?? "";

  const pageTitle = (
    <CardHeader className="gap-0">
      <p className="text-sm font-medium text-ink-tertiary">Library</p>
      <CardTitle className="text-h3">My Categories</CardTitle>
    </CardHeader>
  );

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {pageTitle}
        <ListModeToggle
          value={mode}
          onChange={handleModeChange}
          className="self-start sm:self-auto"
        />
      </div>

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
          placeholder="Search by name…"
          className="flex-1"
        />

        <div className="flex flex-wrap gap-2">
          {isDummyActionsEnabled ? (
            <Button variant="secondary" onClick={handleDummyCreateClick} aria-label="Add Dummy">
              {isCreatingDummy ? "Saving..." : "Add Dummy"}
            </Button>
          ) : null}

          <Button onClick={handleAddCategory} aria-label="Create Category">
            + Create Category
          </Button>
        </div>
      </div>

      {rawErrorMsg ? (
        <p role="alert" className="text-xs text-status-error sm:text-sm">
          {rawErrorMsg}
        </p>
      ) : null}
    </div>
  );

  const renderMobileSortControls = () =>
    !isDesktopViewport ? (
      <SortChipGroup
        sortBy={sortField as keyof MetricCategoryVM}
        sortOrder={sortDir}
        onSort={(key) => onColumnSort(String(key))}
        columns={mobileColumns}
        className="w-full"
      />
    ) : null;

  const paginatedSection = (
    <section className="flex flex-col gap-4">
      {renderMobileSortControls()}

      <MetricCategoryTable
        categories={pages.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditCategory}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
      />

      <Pagination
        page={pages.page}
        pageSize={limit}
        total={pages.totalCount}
        onChange={handlePageChange}
        canPrev={pages.canPrev}
        canNext={pages.canNext}
      />
    </section>
  );

  const infiniteSection = (
    <section className="flex flex-col gap-4">
      {renderMobileSortControls()}

      <MetricCategoryTable
        categories={infinite.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditCategory}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
      />

      {infinite.hasNextPage ? (
        <div className="my-2 flex justify-center">
          <Button
            variant="primary"
            onClick={() => void infinite.fetchNextPage()}
            aria-label="Load more metric categories"
            disabled={infinite.isFetchingNextPage}
          >
            {infinite.isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {infinite.isFetchingNextPage ? "Loading more categories" : ""}
      </div>
    </section>
  );

  const content = (
    <div className="flex flex-col gap-6">
      {header}

      {isInitialLoading ? (
        <SkeletonLoader count={8} className="h-10" />
      ) : isEmpty ? (
        <EmptyDataIndicator
          title="No Categories Yet"
          description="Create a category to organize your metrics."
          tooltip="Categories help keep related metrics grouped."
        />
      ) : isPages ? (
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

export default MetricCategoriesPageClient;
