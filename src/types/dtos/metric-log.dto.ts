import { z } from "zod";
import { generateDummyMetricLogsSchema } from "@/types/api/zod-metric-log.schema";
import { ISODateTimeString } from "../aliases";

// * ===== Response DTOs =====

/**
 * @interface MetricLogResponseDTO
 * @description Represents the structure of a MetricLog object as returned in API responses.
 */
export interface MetricLogResponseDTO {
  readonly id: string;
  readonly metricId: string;
  readonly type: "manual" | "automatic";
  readonly logValue: number;
  readonly loggedAt: string; // ISO string
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * @typedef MetricLogListResponseDTO
 * @description Offset-based pagination response for a list of metric logs.
 * @deprecated Use cursor-based pagination instead (PaginatedMetricLogListResponseDTO)
 */
export interface PaginatedMetricLogListResponseDTO {
  logs: MetricLogResponseDTO[];
  total: number;
}

// * ===== Request DTOs =====

// Dev Note: Legacy DTO using Zod params and body schema extraction is commented out for reference.

// /**
//  * @typedef CreateMetricLogRequestDTO
//  * @description Represents the expected structure of the request body when creating a new metric log entry.
//  * Inferred from the Zod schema for validation.
//  */
// export type CreateMetricLogRequestDTO = z.infer<
//   typeof createMetricLogSchema.shape.body
// >;
// /**
//  * @typedef UpdateMetricLogRequestDTO
//  * @description Represents the expected structure of the request body when updating an existing metric log entry.
//  * Inferred from the Zod schema for validation.
//  */
// export type UpdateMetricLogRequestDTO = z.infer<
//   typeof updateMetricLogSchema.shape.body
// >;

export type CreateMetricLogRequestDTO = {
  metricId?: string;
  logValue: number;
  type?: "manual" | "automatic";
  loggedAt?: ISODateTimeString; // optional; if omitted, server fills "now"
};
export type UpdateMetricLogRequestDTO = {
  metricId?: string;
  logValue?: number;
  type?: "manual" | "automatic";
  loggedAt?: ISODateTimeString;
};

// * ===== DTOs for Testing Purposes =====

/**
 * @typedef GenerateDummyMetricLogsRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric log entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricLogsRequestDTO = z.infer<
  typeof generateDummyMetricLogsSchema.shape.body
>;
