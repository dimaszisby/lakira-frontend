import { z } from "zod";

import {
  zDateOptional,
  zDateRequired,
  zLogType,
  zPositiveFloat,
  zUUID,
} from "@/src/constants/zod-rules";

// TODO: Currently schema is not used in the frontend, only for backend validation.
// However, we can use this for form validation in the future if needed.

export const createMetricLogSchema = z.object({
  body: z.object({
    metricId: zUUID,
    type: zLogType.optional().default("manual"),
    logValue: zPositiveFloat,
    loggedAt: zDateRequired,
  }),
});

export const updateMetricLogSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  body: z.object({
    type: zLogType.optional(),
    logValue: zPositiveFloat.optional(),
    loggedAt: zDateRequired,
  }),
});

export const getMetricLogSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const getAllMetricLogsSchema = z.object({
  query: z
    .object({
      metricId: zUUID.optional(),
      startDate: zDateOptional,
      endDate: zDateOptional,
      sortBy: z.string().optional(),
      order: z.enum(["asc", "desc"]).optional(),
      page: z.preprocess(Number, z.number().int().min(1)).optional().default(1),
      limit: z.preprocess(Number, z.number().int().min(1)).optional().default(10),
    })
    .optional(),
});

export const deleteMetricLogSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const getAggregatedStatsSchema = z.object({
  query: z.object({
    metricId: zUUID.optional(),
  }),
});

/**
 * * ===== Schemas for Testing Purposes =====
 */

export const generateDummyMetricLogsSchema = z.object({
  body: z.object({
    metricId: zUUID,
    count: z.number().int().min(1).max(1000).default(50), // Default to 50, max 1000 to prevent abuse
  }),
});
