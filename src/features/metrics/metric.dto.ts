import type { z } from "zod";

import type { ISODateString, ISODateTimeString } from "@/src/generics/date/aliases";
import type {
  createMetricSchema,
  deleteMetricSchema,
  generateDummyMetricsSchema,
  getMetricSchema,
  updateMetricSchema,
} from "@/types/api/zod-metric.schema";
import type { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";
import type { MetricLogResponseDTO } from "@/types/dtos/metric-log.dto";
import type { MetricSettingsResponseDTO } from "@/types/dtos/metric-settings.dto";

// TODO: Unify Redundants

// * ===== Response DTOs =====

/**
 * @interface MetricResponseDTO
 * @description Represents the structure of a Metric object as returned in basic API responses (e.g., after create/update).
 */
export interface MetricResponseDTO {
  readonly id: string;

  // Base
  readonly name: string;
  readonly description: string | null;
  readonly defaultUnit: string;
  readonly isPublic: boolean;

  // Relations
  readonly userId: string;
  readonly categoryId: string | null;
  readonly originalMetricId: string | null;

  // Timestamps
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

/**
 * @interface MetricPreviewCategoryDTO
 * @description Represents summarized category information for a metric preview.
 */
// TODO: Unify with MetricCategoryResponseDTO
export interface MetricPreviewCategoryDTO {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
}

/**
 * @interface MetricPreviewResponseDTO
 * @description Represents a simplified view of a metric, typically for list displays or previews.
 */
export interface MetricPreviewResponseDTO {
  readonly id: string;

  // Base
  readonly name: string;
  readonly defaultUnit: string;
  readonly description: string | null;
  readonly isPublic: boolean;

  // Relations
  readonly originalMetricId?: string | null;
  readonly category: MetricPreviewCategoryDTO | null;
  readonly logCount: number;
  readonly goalType: string | null;

  // Timestamps
  readonly createdAt: ISODateTimeString;
  readonly updatedAt: ISODateTimeString;
}

/**
 * @typedef PaginatedMetricListResponseDTO
 * @description migrated to cursor method, but still used on Category Form and Metric Form
 */
export interface PaginatedMetricListResponseDTO {
  metrics: MetricPreviewResponseDTO[];
  total: number;
}

/**
 * @interface UserMetricDetailResponseDTO
 * @description Represents a detailed view of a metric, including associated category, settings, and logs.
 */
export interface UserMetricDetailResponseDTO {
  readonly id: string;

  // Relations IDs
  readonly userId: string;
  readonly categoryId: string | null;
  readonly originalMetricId: string | null;

  readonly name: string;
  readonly description: string | null;
  readonly defaultUnit: string;
  readonly isPublic: boolean;

  readonly createdAt: ISODateString; // ISO Date string
  readonly updatedAt: ISODateString; // ISO Date string

  // Relations (optional query includes)
  readonly category?: MetricCategoryResponseDTO | null;
  readonly settings?: MetricSettingsResponseDTO | null;
  readonly logs?: MetricLogResponseDTO[] | null;
}

// * ===== Request DTOs =====

/**
 * @typedef CreateMetricRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricRequestDTO = z.infer<typeof createMetricSchema.shape.body>;

/**
 * @typedef UpdateMetricRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricRequestDTO = z.infer<typeof updateMetricSchema.shape.body>;

/**
 * @typedef GetMetricRequestDTO
 * @description Represents the expected structure of the request parameters when retrieving a specific metric.
 * Inferred from the Zod schema for validation.
 */
export type GetMetricInput = z.infer<typeof getMetricSchema>["params"];

/**
 * @typedef DeleteMetricRequestDTO
 * @description Represents the expected structure of the request parameters when deleting a specific metric.
 * Inferred from the Zod schema for validation.
 */
export type DeleteMetricInput = z.infer<typeof deleteMetricSchema>["params"];

/**
 * * ===== DTOs for Testing Purposes =====
 */

/**
 * @typedef GenerateDummyMetricsRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricsRequestDTO = z.infer<typeof generateDummyMetricsSchema.shape.body>;
