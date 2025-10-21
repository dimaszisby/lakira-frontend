import type { CursorPage } from "./CursorPage";

export type CursorPageVM<TIn, TOut, S extends string, F> = Omit<CursorPage<TIn, S, F>, "items"> & {
  items: TOut[];
};
