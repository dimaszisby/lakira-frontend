import type { z } from "zod";

import { createMetricCategorySchema } from "@/src/types/api/zod-metric-category.schema";

// * Schema
export const metricCategoryFormSchema = createMetricCategorySchema.shape.body;
export type MetricCategoryFormInput = z.infer<typeof metricCategoryFormSchema>;
