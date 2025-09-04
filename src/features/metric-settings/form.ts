import { createMetricSettingsSchema } from "@/src/types/api/zod-metric-settings.schema";
import { z } from "zod";

export const metricSettingsFormSchema = createMetricSettingsSchema.shape.body;
export type MetricSettingsFormInputs = z.infer<typeof metricSettingsFormSchema>;
