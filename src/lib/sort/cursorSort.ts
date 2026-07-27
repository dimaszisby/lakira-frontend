import type { ParsedSort, SortOrder, SortParam } from "@/src/generics/sort";

// Narrow a value to a known key
export function isSortableKey<K extends string>(v: unknown, allowed: readonly K[]): v is K {
  return typeof v === "string" && (allowed as readonly string[]).includes(v);
}

// Narrow a value to a known sort param (accepts "-key" or "key")
export function isSortParam<K extends string>(
  v: unknown,
  allowed: readonly K[],
): v is SortParam<K> {
  if (typeof v !== "string") return false;
  const k = v.startsWith("-") ? v.slice(1) : v;
  return (allowed as readonly string[]).includes(k);
}

// Convert string form into structured form
export function parseSort<K extends string>(s: SortParam<K>): ParsedSort<K> {
  const desc = s.startsWith("-");
  const field = (desc ? s.slice(1) : s) as K;
  return { field, dir: desc ? "DESC" : "ASC" };
}

// Convert structured form into string form
export function toSortParam<K extends string>(field: K, dir: SortOrder): SortParam<K> {
  return (dir === "DESC" ? (`-${field}` as SortParam<K>) : field) as SortParam<K>;
}

// Clamp unknown to a valid SortParam<K> with fallback
export function clampSort<K extends string>(
  raw: unknown,
  allowed: readonly K[],
  fallback: SortParam<K>,
): SortParam<K> {
  return isSortParam<K>(raw, allowed) ? (raw as SortParam<K>) : fallback;
}

/**
 * Toggle or jump to a column with sensible defaults.
 * - If clicking the same column, toggles ASC <-> DESC.
 * - If switching column, uses default dir (DESC for numbers/dates, ASC for strings—configurable).
 */
export function nextSortForColumn<K extends string>(
  current: SortParam<K>,
  column: K,
  defaults?: { descByDefault?: readonly K[] },
): SortParam<K> {
  const { field, dir } = parseSort(current);
  if (field === column) return toSortParam(column, dir === "ASC" ? "DESC" : "ASC");
  const descDefault = defaults?.descByDefault?.includes(column) ?? false;
  return toSortParam(column, descDefault ? "DESC" : "ASC");
}

/**
 * Factory to generate strongly-typed helpers per feature.
 *
 * Usage:
 *  const metricSort = createCursorSort({
 *      keys: ["createdAt","updatedAt","name","logCount"] as const,
 *      defaultDesc: ["createdAt","updatedAt","logCount"] as const,
 *      defaultSort: "-createdAt" as const,
 *  })
 */
export function createCursorSort<const K extends readonly string[]>(config: {
  keys: K;
  defaultDesc?: readonly K[number][];
  defaultSort: SortParam<K[number]>;
}) {
  type Key = K[number];
  const keys = config.keys;
  const descByDefault = config.defaultDesc ?? [];
  const DEFAULT_SORT = config.defaultSort;

  return {
    // Canonical list of allowed columns (runtime + type)
    KEYS: keys,

    // Default sort for this feature (string form)
    DEFAULT_SORT,
    // Type guard for raw keys.
    isKey: (v: unknown): v is Key => isSortableKey(v, keys),

    // Parse "field" | "-field" into { field, dir }
    parseSort: (s: SortParam<Key>) => parseSort<Key>(s),

    // Build "field" | "-field" from parts
    toSortParam: (f: Key, d: SortOrder) => toSortParam<Key>(f, d),

    // Toggle or jump with per-feature default directions
    nextSortForColumn: (cur: SortParam<Key>, col: Key) =>
      nextSortForColumn<Key>(cur, col, { descByDefault }),

    // Read & clamp `sort` from URLSearchParams (param name is configurable)
    sortFromSearchParams: (sp: URLSearchParams, paramName = "sort"): SortParam<Key> => {
      const raw = sp.get(paramName);
      return clampSort<Key>(raw, keys, DEFAULT_SORT);
    },
  };
}
