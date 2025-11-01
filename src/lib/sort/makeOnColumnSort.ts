import type { SortParam } from "@/src/generics/sort";

export function makeOnColumnSort<K extends string>(
  isKey: (v: unknown) => v is K,
  nextForColumn: (cur: SortParam<K>, col: K) => SortParam<K>,
  setSort: (updater: (cur: SortParam<K>) => SortParam<K>) => void,
) {
  return (column: unknown) => {
    if (!isKey(column)) return;
    setSort((cur) => nextForColumn(cur, column));
  };
}
