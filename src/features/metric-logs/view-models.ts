import type { CursorPageVM } from "@/generics/cursor/view-model";
import type { ISODateTimeString } from "@/types/aliases";
import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";

import type { MetricLogFilter, MetricLogSortableKey } from "./sort";

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
export type MetricLogCursorPageVM = CursorPageVM<
  MetricLogResponseDTO,
  MetricLogVM,
  MetricLogSortableKey,
  MetricLogFilter
>;
