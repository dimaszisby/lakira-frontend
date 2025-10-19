import type { ISODateTimeString } from "@/src/types/aliases";

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
