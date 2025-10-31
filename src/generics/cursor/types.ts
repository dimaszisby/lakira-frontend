// Compose a sort param from a union of sortable keys
export type SortParam<S extends string> = S | `-${S}`;

// Generic cursor response envelope
export type CursorPage<T, S extends string = string, F = unknown> = {
  items: T[];
  nextCursor?: string;
  sort: SortParam<S>; // sortable Key for each domain
  limit: number;
  q?: string;
  filter?: F;
  totalCount?: number; // optional query params
};

// Replace the `items` array type of a page while preserving other fields
export type ReplaceItems<TPage, TItem> = TPage extends { items: unknown[] }
  ? Omit<TPage, "items"> & { items: TItem[] }
  : never;

// Page has at least `items` and optional `nextCursor`/`totalCount`
export type CursorPageLike<TItem> = {
  items: TItem[];
  nextCursor?: string | null;
  totalCount?: number | null;
};

// Page/cursor state machine for cursor-paged screens
export type CursorMap = Record<number, string | null>;
