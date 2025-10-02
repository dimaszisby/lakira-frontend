import type { CursorPage, SortParam } from "@/src/types/generics/CursorPage";

import type { MetricSettingsExtendedVM } from "./view-models";

// MetricExtended Opts
export type ListOptions = { enabled?: boolean; staleTime?: number };

// * Cursor
export type SortOrder = "ASC" | "DESC"; // Keep local for now, or move to a shared generics file
export type MetricSettingsSortParamViaCursor =
  | "createdAt"
  | "-createdAt"
  | "updatedAt"
  | "-updatedAt";

/** Only the keys MetricSettings can sort by */
export type MetricSettingsSortableKeyViaCursor = "createdAt" | "updatedAt";

export type MetricSettingsSortViaCursor = SortParam<MetricSettingsSortParamViaCursor>;
export type MetricSettingsFilterViaCursor = {
  metricId?: string;
};
export type MetricSettingsCursorPageResponse = CursorPage<
  MetricSettingsExtendedVM,
  MetricSettingsSortableKeyViaCursor,
  MetricSettingsFilterViaCursor
>;

// TODO: Refactor
export const parseSort = (s: MetricSettingsSortViaCursor) => {
  const dir = s.startsWith("-") ? "DESC" : "ASC";
  const field = s.startsWith("-") ? s.slice(1) : s;
  return { field, dir } as { field: string; dir: "ASC" | "DESC" };
};

// TODO: Refactor
export const nextSortForColumn = (
  current: MetricSettingsSortViaCursor,
  column: MetricSettingsSortableKeyViaCursor,
): MetricSettingsSortViaCursor => {
  const { field, dir } = parseSort(current);
  if (field === column) {
    return (dir === "ASC" ? `-${column}` : column) as MetricSettingsSortViaCursor; // toggle direction
  }
  // Default direction for dates is DESC
  return `-${column}` as MetricSettingsSortViaCursor;
};
