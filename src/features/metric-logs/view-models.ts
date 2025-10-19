import type { ISODateTimeString } from "@/src/types/aliases";
import type { MetricLogResponseDTO } from "@/src/types/dtos/metric-log.dto";
import type { CursorPage } from "@/src/types/generics/CursorPage";

import type { MetricLogFilterViaCursor, MetricLogSortableKeyViaCursor } from "./sort";

export type MetricLogVM = {
  id: string;

  // Parent Relations
  metricId: string;

  // Base
  logValue: number;
  loggedAt: string;
  type: "manual" | "automatic";

  // Timestamps
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

// Preview Cursor Page
// TODO: Refactor
export type CursorPageVM<TIn, TOut, S extends string, F> = Omit<CursorPage<TIn, S, F>, "items"> & {
  items: TOut[];
};
export type MetricLogCursorPageVM = CursorPageVM<
  MetricLogResponseDTO,
  MetricLogVM,
  MetricLogSortableKeyViaCursor,
  MetricLogFilterViaCursor
>;
