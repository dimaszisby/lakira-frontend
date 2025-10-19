// TODO: might need to rename file for better usage interpretation

import { z } from "zod";

// * Form Schema
// export const logFormSchema = createMetricLogSchema.shape.body;

export const logFormSchema = z.object({
  metricId: z.string().uuid(),
  logValue: z.number().nonnegative(),
  type: z.enum(["manual", "automatic"]).default("manual"),
  // Accept string or Date from the input and coerce to Date for form state.
  loggedAt: z.union([z.date(), z.string()]).transform((v) => (v instanceof Date ? v : new Date(v))),
});

export type LogFormInputs = z.infer<typeof logFormSchema>;
