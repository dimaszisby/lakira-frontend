// TODO: might need to rename file for better usage interpretation

import { z } from "zod";

import { ZodMessages } from "@/constants/zod-messages";

// * Form Schema
// export const logFormSchema = createMetricLogSchema.shape.body;

export const logFormSchema = z.object({
  metricId: z.string().uuid(),
  // The form shows this field's message, so it carries its own copy rather than
  // zod's; an empty input arrives as NaN and is a type error (kit `zod-4-upgrade`, D-02).
  logValue: z
    .number({ error: ZodMessages.metricLog.logValueRequired })
    .nonnegative({ message: ZodMessages.metricLog.logValueNegative }),
  type: z.enum(["manual", "automatic"]).default("manual"),
  // Accept string or Date from the input and coerce to Date for form state.
  loggedAt: z.union([z.date(), z.string()]).transform((v) => (v instanceof Date ? v : new Date(v))),
});

export type LogFormInputs = z.infer<typeof logFormSchema>;
/** What the form holds before validation: zod 4 types a defaulted field as optional on input. */
export type LogFormFields = z.input<typeof logFormSchema>;
