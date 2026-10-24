import type { z } from "zod";

import { createMetricCategorySchema } from "@/src/types/api/zod-metric-category.schema";

// * Schema
export const metricCategoryFormSchema = createMetricCategorySchema.shape.body;
export type MetricCategoryFormInput = z.infer<typeof metricCategoryFormSchema>;
/** What the form holds before validation: zod 4 types a defaulted field as optional on input. */
export type MetricCategoryFormFields = z.input<typeof metricCategoryFormSchema>;
