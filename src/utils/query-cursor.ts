import type { InfiniteData } from "@tanstack/react-query";
import type { DependencyList } from "react";
import { useCallback, useEffect, useState } from "react";

/**
 * Replace the `items` array type of a page while preserving other fields
 */
export type ReplaceItems<TPage, TItem> = TPage extends { items: unknown[] }
  ? Omit<TPage, "items"> & { items: TItem[] }
  : never;

/** Page has at least `items` and optional `nextCursor`/`totalCount` */
export type CursorPageLike<TItem> = {
  items: TItem[];
  nextCursor?: string | null;
  totalCount?: number | null;
};

/**
 * Map items inside a single cursor page
 */
export function mapCursorPageItems<TIn, TOut, TPage extends { items: TIn[] }>(
  page: TPage,
  mapItem: (x: TIn) => TOut,
): ReplaceItems<TPage, TOut> {
  return { ...page, items: page.items.map(mapItem) } as unknown as ReplaceItems<TPage, TOut>;
}

/**
 * Map items across all pages of an InfiniteData result
 */
export function mapInfiniteCursorItems<TIn, TOut, TPage extends { items: TIn[] }, TPageParam>(
  data: InfiniteData<TPage, TPageParam>,
  mapItem: (x: TIn) => TOut,
): InfiniteData<ReplaceItems<TPage, TOut>, TPageParam> {
  return {
    pageParams: data.pageParams,
    pages: data.pages.map((p) => mapCursorPageItems(p, mapItem)),
  };
}

/**
 * Selectors you can pass directly to React Query `select`
 */
export function makePageItemsSelect<TIn, TOut, TPage extends { items: TIn[] }>(
  mapItem: (x: TIn) => TOut,
) {
  return (page: TPage) => mapCursorPageItems(page, mapItem);
}
export function makeInfiniteItemsSelect<TIn, TOut, TPage extends { items: TIn[] }, TPageParam>(
  mapItem: (x: TIn) => TOut,
) {
  return (data: InfiniteData<TPage, TPageParam>) => mapInfiniteCursorItems(data, mapItem);
}

/**
 * Page/cursor state machine for cursor-paged screens
 */
export type CursorMap = Record<number, string | null>;

export function useCursorPager(resetDeps: DependencyList) {
  const [page, setPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | null>>({ 1: null });

  // Reset page & cursor map when upstream params change
  useEffect(() => {
    setPage(1);
    setCursorByPage({ 1: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dynamic dependency list; values are primitives derived at call site
  }, resetDeps);

  const after = cursorByPage[page] ?? undefined;

  const updateNextCursor = useCallback(
    (next?: string | null) => {
      if (!next) return;
      setCursorByPage((prev) => (prev[page + 1] === next ? prev : { ...prev, [page + 1]: next }));
    },
    [page],
  );

  const canPrev = page > 1;
  const canNextUsing = (nextFromQuery?: string | null | undefined) =>
    Boolean(cursorByPage[page + 1] ?? nextFromQuery ?? null);

  return { page, setPage, after, updateNextCursor, cursorByPage, canPrev, canNextUsing };
}

/**
 * Common cursor helpers
 */
export function getNextCursor<T extends { nextCursor?: string | null }>(
  lastPage: T,
): string | undefined {
  return lastPage.nextCursor ?? undefined;
}

/**
 * tility for total pages calc when server exposes totalCount
 */
export function computeTotalPages(totalCount: number | null | undefined, limit: number) {
  return totalCount ? Math.max(1, Math.ceil(totalCount / Math.max(1, limit))) : undefined;
}
