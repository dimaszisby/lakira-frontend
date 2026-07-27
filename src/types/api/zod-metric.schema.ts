import { z } from "zod";

import {
  zMetricCategoryId,
  zMetricDefaultUnit,
  zMetricDescription,
  zMetricIsPublic,
  zMetricName,
  zMetricOriginalId,
  zUUID,
} from "@/src/constants/zod-rules";

// Schemas
export const createMetricSchema = z.object({
  body: z.object({
    categoryId: zMetricCategoryId.nullable().optional(),
    originalMetricId: zMetricOriginalId.nullable().optional(),
    name: zMetricName,
    description: zMetricDescription.optional(),
    defaultUnit: zMetricDefaultUnit,
    isPublic: zMetricIsPublic,
  }),
});

export const updateMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
  // Make all fields optional for update
  body: z.object({
    categoryId: zMetricCategoryId.nullable().optional(),
    originalMetricId: zMetricOriginalId.nullable().optional(),
    name: zMetricName.optional(),
    description: zMetricDescription.nullable().optional(),
    defaultUnit: zMetricDefaultUnit.optional(),
    isPublic: zMetricIsPublic.optional(),
  }),
});

export const getMetricSchema = z.object({
  params: z.object({
    id: zUUID,
  }),
});

export const deleteMetricSchema = getMetricSchema;

/**
 * * ===== Schemas for Testing Purposes =====
 */

export const generateDummyMetricsSchema = z.object({
  body: z.object({
    count: z.number().int().min(1).max(10).default(5), // Default to 5, max 100
  }),
});
