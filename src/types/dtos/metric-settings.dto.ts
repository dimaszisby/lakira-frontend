// TODO: Refactor to correct foldering
import type { z } from "zod";

import type {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
} from "@/types/api/zod-metric-settings.schema";

import type { ISODateString, ISODateTimeString } from "../aliases";

// TODO - Refactor: to Enum
type GoalType = "cumulative" | "incremental";
type ChartType = "line" | "bar" | "area" | "pie";

/**
 * @interface DisplayOptionsDTO
 * @description Represents the display options for a metric setting DTO.
 */
export interface DisplayOptionsDTO {
  readonly showOnDashboard: boolean;
  readonly priority: number | null;
  readonly chartType: ChartType | null;
  readonly color: string | null;
}

// * Response DTOs

/**
 * @interface MetricSettingsResponseDTO
 * @description Represents the structure of a MetricSettings object as returned in API responses.
 */
export interface MetricSettingsResponseDTO {
  readonly id: string;

  // Relations
  readonly metricId: string;

  // Base
  readonly isActive: boolean;

  readonly goalEnabled: boolean;
  readonly goalType: GoalType | null;
  readonly goalValue: number | null;
  readonly timeFrameEnabled: boolean;
  readonly startDate: ISODateString | null;
  readonly deadlineDate: ISODateString | null;
  readonly alertEnabled: boolean;
  readonly alertThresholds: number | null;
  readonly isAchieved: boolean;

  readonly displayOptions: DisplayOptionsDTO;

  // Timestamps
  readonly createdAt: ISODateTimeString;
  readonly updatedAt: ISODateTimeString;
}

// * Request DTOs

/**
 * @typedef CreateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when creating new metric settings.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricSettingsRequestDTO = z.infer<typeof createMetricSettingsSchema.shape.body>;

/**
 * @typedef UpdateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when updating existing metric settings.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricSettingsRequestDTO = z.infer<typeof updateMetricSettingsSchema.shape.body>;
