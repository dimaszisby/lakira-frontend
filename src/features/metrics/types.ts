import type { z } from "zod";

import { createMetricSchema } from "@/src/types/api/zod-metric.schema";

import type { ServerSortBy, SortOrder } from "./sort";

// ===== Form =====
export const metricFormSchema = createMetricSchema.shape.body;
export type MetricFormInputs = z.infer<typeof metricFormSchema>;

// ===== API Includes and Params =====

// MetricExtended Opts
export type IncludeKey = "settings" | "category" | "logs"; // For extended metric details
export type ListOptions = { enabled?: boolean; staleTime?: number };

export type MetricsListParams = {
  page?: number;
  limit?: number;
  sortBy?: ServerSortBy;
  sortOrder?: SortOrder;
  // optional filters you actually support on BE:
  q?: string;
  name?: string;
  categoryId?: string;
  isPublic?: boolean;
  // future: add more filters here as needed
};
