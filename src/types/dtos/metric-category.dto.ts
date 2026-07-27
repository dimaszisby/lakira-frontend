import type { z } from "zod";

import type {
  createMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
  updateMetricCategorySchema,
} from "@/types/api/zod-metric-category.schema";

/**
 * @file src/types/dtos/metric-category.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricCategory.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

// * Response DTOs

/**
 * @interface MetricCategoryResponseDTO
 * @description Represents the structure of a MetricCategory object as returned in API responses.
 */
export interface MetricCategoryResponseDTO {
  readonly id: string;

  // Base
  readonly name: string;
  readonly color: string;
  readonly icon: string;

  // Relations
  readonly metricCount: number;

  // Timestamps
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt?: string | null;
}

export interface PaginatedMetricCategoryListResponseDTO {
  categories: MetricCategoryResponseDTO[];
  total: number;
}

// * Request DTOs

/**
 * @typedef CreateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric category.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricCategoryRequestDTO = z.infer<typeof createMetricCategorySchema.shape.body>;

/**
 * @typedef UpdateMetricCategoryRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric category.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricCategoryRequestDTO = z.infer<typeof updateMetricCategorySchema.shape.body>;

/**
 * * ===== DTOs for Testing Purposes =====
 */

/**
 * @typedef GenerateDummyMetricCategoriesRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric category entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricCategoriesRequestDTO = z.infer<
  typeof generateDummyMetricCategoriesSchema.shape.body
>;
