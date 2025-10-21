import type { CursorPage } from "./CursorPage";

export const mapCursorPage = <TIn, TOut, S extends string, F>(
  page: CursorPage<TIn, S, F>,
  mapItem: (x: TIn) => TOut,
) => ({ ...page, items: page.items.map(mapItem) });
