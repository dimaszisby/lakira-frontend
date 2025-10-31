import type { InfiniteData } from "@tanstack/react-query";

import type { CursorPage, ReplaceItems } from "@/src/generics/cursor/types";

export const mapCursorPage = <TIn, TOut, S extends string, F>(
  page: CursorPage<TIn, S, F>,
  mapItem: (x: TIn) => TOut,
) => ({ ...page, items: page.items.map(mapItem) });

// Map items inside a single cursor page
export function mapCursorPageItems<TIn, TOut, TPage extends { items: TIn[] }>(
  page: TPage,
  mapItem: (x: TIn) => TOut,
): ReplaceItems<TPage, TOut> {
  return { ...page, items: page.items.map(mapItem) } as unknown as ReplaceItems<TPage, TOut>;
}

// Map items across all pages of an InfiniteData result
export function mapInfiniteCursorItems<TIn, TOut, TPage extends { items: TIn[] }, TPageParam>(
  data: InfiniteData<TPage, TPageParam>,
  mapItem: (x: TIn) => TOut,
): InfiniteData<ReplaceItems<TPage, TOut>, TPageParam> {
  return {
    pageParams: data.pageParams,
    pages: data.pages.map((p) => mapCursorPageItems(p, mapItem)),
  };
}

// Selectors you can pass directly to React Query `select`
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

// Common cursor helpers
export function getNextCursor<T extends { nextCursor?: string | null }>(
  lastPage: T,
): string | undefined {
  return lastPage.nextCursor ?? undefined;
}

// utility for total pages calc when server exposes totalCount
export function computeTotalPages(totalCount: number | null | undefined, limit: number) {
  return totalCount ? Math.max(1, Math.ceil(totalCount / Math.max(1, limit))) : undefined;
}
