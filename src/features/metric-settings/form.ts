import type { z } from "zod";

import { createMetricSettingsSchema } from "@/src/types/api/zod-metric-settings.schema";

export const metricSettingsFormSchema = createMetricSettingsSchema.shape.body;
export type MetricSettingsFormInputs = z.infer<typeof metricSettingsFormSchema>;
