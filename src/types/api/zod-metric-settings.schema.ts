// src/types/api/zod-metric-settings.schema.ts
// TODO: Refactor to correct foldering
import { z } from "zod";

import {
  zAlertThresholds,
  zDisplayOptions,
  zGoalType,
  zGoalValue,
  zISODateTime,
  zUUID,
} from "@/src/constants/zod-rules";

// Developer Note: currently creation handled in back-end.
// Current MVP: one metric have one metricsettings
export const createMetricSettingsSchema = z.object({
  body: z
    .object({
      metricId: zUUID,
      goalEnabled: z.boolean().optional().default(false),
      goalType: zGoalType.optional().nullable(),
      goalValue: zGoalValue.optional().nullable(),

      timeFrameEnabled: z.boolean().optional().default(false),
      startDate: zISODateTime.optional().nullable(),
      deadlineDate: zISODateTime.optional().nullable(),

      alertEnabled: z.boolean().optional().default(false),
      alertThresholds: zAlertThresholds.optional(),

      displayOptions: zDisplayOptions,
    })
    .refine(
      (data) => {
        if (data.goalEnabled) {
          return data.goalType !== null && data.goalValue !== null;
        }
        return true;
      },
      {
        message:
          "goalType and goalValue are required when goalEnabled is true.",
      }
    )
    .refine(
      (data) => {
        if (data.timeFrameEnabled) {
          return (
            data.startDate &&
            data.deadlineDate &&
            data.deadlineDate > data.startDate
          );
        }
        return true;
      },
      {
        message:
          "startDate and deadlineDate are required, and deadlineDate must be after startDate when timeFrameEnabled is true.",
      }
    ),
});

export const updateMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  body: z.object({
    goalEnabled: z.boolean().optional(),
    goalType: zGoalType.optional(),
    goalValue: zGoalValue.optional(),

    timeFrameEnabled: z.boolean().optional(),
    startDate: zISODateTime.optional().nullable(),
    deadlineDate: zISODateTime.optional().nullable(),

    alertEnabled: z.boolean().optional(),
    alertThresholds: zAlertThresholds.optional(),

    displayOptions: zDisplayOptions.optional(),
  }),
});

export const getMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const getAllMetricSettingsSchema = z.object({
  query: z
    .object({
      metricId: zUUID.optional(),
    })
    .optional(),
});

export const deleteMetricSettingsSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});
