import type { DependencyList } from "react";
import { useCallback, useEffect, useState } from "react";

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
