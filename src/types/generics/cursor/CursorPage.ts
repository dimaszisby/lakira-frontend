/** Compose a sort param from a union of sortable keys */
export type SortParam<S extends string> = S | `-${S}`;

/** Generic cursor response envelope */
export type CursorPage<T, S extends string = string, F = unknown> = {
  items: T[];
  nextCursor?: string;
  sort: SortParam<S>; // sortable Key for each domain
  limit: number;
  q?: string;
  filter?: F;
  totalCount?: number; // optional query params
};
