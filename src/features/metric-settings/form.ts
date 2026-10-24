import type { z } from "zod";

import { createMetricSettingsSchema } from "@/src/types/api/zod-metric-settings.schema";

export const metricSettingsFormSchema = createMetricSettingsSchema.shape.body;
export type MetricSettingsFormInputs = z.infer<typeof metricSettingsFormSchema>;
/** What the form holds before validation: zod 4 types a defaulted field as optional on input. */
export type MetricSettingsFormFields = z.input<typeof metricSettingsFormSchema>;
