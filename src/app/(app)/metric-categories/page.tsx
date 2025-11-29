"use client";

const DUMMY_FEATURE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS === "true";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { withAuth } from "@/components/hoc/withAuth";
import MetricCategoryForm from "@/features/metric-categories/components/MetricCategoryForm";
import MetricCategoryTable from "@/features/metric-categories/components/MetricCategoryTable";
import { mobileColumns } from "@/features/metric-categories/components/table-config";
import {
  useCreateMetricCategoryDummy,
  useDeleteMetricCategory,
  useMetricCategoryListCursorInfinite,
} from "@/features/metric-categories/hooks/index";
import { useMetricCategoryListCursorPagination } from "@/features/metric-categories/hooks/list.cursor-page.query";
import type { MetricCategorySortParam } from "@/features/metric-categories/sort";
import {
  DEFAULT_METRIC_CATEGORY_SORT,
  isSortableColumn,
  nextSortForColumn,
  parseSort,
} from "@/features/metric-categories/sort";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LIST_MODE_DESKTOP_MQ, useListMode } from "@/hooks/useListMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";
import { makeOnColumnSort } from "@/lib/sort/makeOnColumnSort";
import { handleApiError } from "@/services/api/handleApiError";
import Button from "@/ui/Button";
import Card, { CardHeader, CardTitle } from "@/ui/Card";
import EmptyDataIndicator from "@/ui/EmptyDataIndicator";
import { Pagination } from "@/ui/Pagination";
import PrimaryButton from "@/ui/PrimaryButton";
import SearchInput from "@/ui/SearchInput";
import SkeletonLoader from "@/ui/SekeletonLoader";
import SortChipGroup from "@/ui/SortChipGroup";

const MetricCategoriesPageBase = () => {
  const router = useRouter();
  const isDesktopViewport = useMediaQuery(LIST_MODE_DESKTOP_MQ);
  const { isPages } = useListMode(); // desktop or mobile switch

  // * constants
  const PAGE_SIZE = 50;
  const [sort, setSort] = useState<MetricCategorySortParam>(DEFAULT_METRIC_CATEGORY_SORT);
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sort), [sort]);

  // Search
  const [search, setSearch] = useState("");
  const debouncedQ = useDebouncedValue(search, 350);
  const [filterName] = useState<string>("");

  const params = useMemo(() => {
    const p: {
      limit: number;
      sort: MetricCategorySortParam;
      q?: string;
      filter?: { name: string };
    } = { limit: PAGE_SIZE, sort };

    if (debouncedQ) p.q = debouncedQ;
    if (filterName) p.filter = { name: filterName };

    return p;
  }, [PAGE_SIZE, sort, debouncedQ, filterName]);

  // Hook consumtion based on mode
  const infinite = useMetricCategoryListCursorInfinite({ ...params, enabled: !isPages }); // unchanged
  const pages = useMetricCategoryListCursorPagination({ ...params, enabled: isPages }); // new

  const onColumnSort = useMemo(
    () => makeOnColumnSort(isSortableColumn, nextSortForColumn, setSort),
    [setSort],
  );

  // * Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MetricCategoryVM | null>(null);

  // * Mutation Hooks
  const {
    createCategoryDummy,
    isPending: isCreatingDummy,
    error: createDummyError,
  } = useCreateMetricCategoryDummy();

  const { deleteMetricCategory, error: deleteError } = useDeleteMetricCategory();

  // * Handlers
  const handleRowClick = useCallback(
    (cat: MetricCategoryVM) => router.push(`/metric-categories/${cat.id}`),
    [router],
  );

  // Add handler
  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setModalOpen(true);
  }, []);

  // Edit handler
  const handleEditCategory = useCallback((category: MetricCategoryVM) => {
    setEditingCategory(category);
    setModalOpen(true);
  }, []);

  // Delete handler
  const deleteCategoryAsync = useCallback(
    async (category: MetricCategoryVM) => {
      try {
        await deleteMetricCategory(category.id);
      } catch (error) {
        console.error("Error deleting metric log:", error);
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

  // Dummy create handler
  const dummyMetricAsync = useCallback(async () => {
    if (!DUMMY_FEATURE_ENABLED) return;
    try {
      await createCategoryDummy({ count: 5 }); // Hardcoded count for now
    } catch (error) {
      const errorMessages = handleApiError(error as Error);
      console.error("Mutation error:", errorMessages);
    }
  }, [createCategoryDummy]);

  const handleDummyCreateClick = useCallback(() => {
    void dummyMetricAsync();
  }, [dummyMetricAsync]);

  // Infinite scroll handler
  const handleFetchNextPage = useCallback(() => {
    if (infinite.hasNextPage) {
      void infinite.fetchNextPage();
    }
  }, [infinite]);

  // * Derived State / Computed Values
  const rawErrorMsg = createDummyError?.message || deleteError?.message || "";
  const errorMsg = rawErrorMsg ? sanitizeErrorMessage(rawErrorMsg) : "";
  const loading = isPages ? pages.isFetching && pages.items.length === 0 : infinite.isLoading;
  const empty = isPages ? pages.items.length === 0 : infinite.items.length === 0;

  const pageTitle = (
    <CardHeader className="gap-0">
      <p className="text-sm font-medium text-ink-tertiary">Library</p>
      <CardTitle className="text-h3">My Category</CardTitle>
    </CardHeader>
  );

  const header = () => (
    <div className="flex flex-col gap-4">
      {/* Error Message */}
      {/* <ErrorMessage message={errorMsg}></ErrorMessage> */}

      {/* Buttons */}
      <span className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          isLoading={
            isPages
              ? pages.isFetching && !!pages.items.length
              : infinite.isFetching && !infinite.isFetchingNextPage
          }
          placeholder="Search by name…"
          className="flex-1"
        />

        <span className="flex flex-wrap gap-2">
          {DUMMY_FEATURE_ENABLED ? (
            <Button
              variant="secondary"
              onClick={handleDummyCreateClick}
              aria-label="Add Metric Dummy"
            >
              {isCreatingDummy ? "Saving..." : "Add Dummy"}
            </Button>
          ) : null}

          <Button onClick={handleAddCategory} aria-label="Create Category" className="ml-2">
            + Create Metric
          </Button>
        </span>
      </span>

      {errorMsg ? <p className="text-xs text-red-500 sm:text-sm">{errorMsg}</p> : null}
    </div>
  );

  const renderInfiniteSection = () => (
    <section className="h-fit overflow-x-clip">
      <MetricCategoryTable
        categories={infinite.items}
        sortBy={sortField}
        sortOrder={sortDir}
        onSort={(col) => onColumnSort(String(col))}
        onEdit={handleEditCategory}
        onDelete={handleDeleteClick}
      />

      {infinite.hasNextPage ? (
        <div className="my-4 flex justify-center">
          <PrimaryButton onClick={handleFetchNextPage} ariaLabel="Load more">
            {infinite.isFetchingNextPage ? "Loading..." : "Load more"}
          </PrimaryButton>
        </div>
      ) : null}
      <div className="sr-only" aria-live="polite">
        {infinite.isFetchingNextPage ? "Loading more categories…" : ""}
      </div>
    </section>
  );

  const renderPaginatedSection = () => (
    <>
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
        pageSize={PAGE_SIZE}
        total={pages.totalCount} // ✅ shows "Page X of Y" when available
        onChange={pages.setPage}
        canPrev={pages.canPrev} // optional: if your component supports it
        canNext={pages.canNext} // optional
      />
    </>
  );

  const content = (
    <>
      {loading ? (
        <SkeletonLoader count={20} className="h-10" />
      ) : empty ? (
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
    </>
  );

  const mobileStickyHeader = (
    <div className="z-20 bg-bg px-4 py-4 shadow-sm sm:px-6 lg:hidden">
      <div className="flex flex-col gap-4">
        {pageTitle}
        {header()}
        <div className="z-20 max-w-max overflow-clip">
          <SortChipGroup
            sortBy={sortField as keyof MetricCategoryVM}
            sortOrder={sortDir}
            onSort={(key) => onColumnSort(String(key))}
            columns={mobileColumns}
            className="lg:hidden"
          />
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (isDesktopViewport) return;

    const root = document.documentElement;
    const previousBodyOverflowY = document.body.style.overflowY;
    const previousRootOverflowY = root.style.overflowY;

    document.body.style.overflowY = "hidden";
    root.style.overflowY = "hidden";

    return () => {
      document.body.style.overflowY = previousBodyOverflowY;
      root.style.overflowY = previousRootOverflowY;
    };
  }, [isDesktopViewport]);

  const mobileLayout = (
    <section className="flex h-[100svh] flex-col overflow-hidden bg-red-100 lg:hidden">
      {/* Non-scrolling header */}
      {mobileStickyHeader}

      {/* Scrollable content / table area */}
      <div className="min-h-0 flex-1 px-4 pt-4 sm:px-6">
        <div className="h-full overflow-y-auto pb-24">
          <div className="flex flex-col gap-4">{content}</div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {isDesktopViewport ? (
        <Card size="sm" variant="primary" className="flex flex-col gap-4">
          {pageTitle}
          {header()}
          {content}
        </Card>
      ) : (
        mobileLayout
      )}

      {modalOpen ? (
        <MetricCategoryForm
          initialCategory={editingCategory}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
        />
      ) : null}
    </>
  );
};

const MetricCategoriesPage = withAuth(MetricCategoriesPageBase);
export default MetricCategoriesPage;
