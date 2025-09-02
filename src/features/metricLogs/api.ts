import {
  MetricLogResponseDTO,
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
  PaginatedMetricLogListResponseDTO,
  GenerateDummyMetricLogsRequestDTO,
} from "@/src/types/dtos/metric-log.dto";
import api from "../../services/api/api";
import ApiResponse, { unwrap } from "@/types/generics/ApiResponse";
import { handleApiError } from "@/src/services/api/handleApiError";
import {
  MetricLogCursorPageResponse,
  MetricLogFilterViaCursor,
  MetricLogSortViaCursor,
} from "./sort";

// TODO: Generic Function
type ListLogsRequestParams = {
  limit?: number; // default 20
  sort?: MetricLogSortViaCursor;
  q?: string;
  filter?: MetricLogFilterViaCursor;
  after?: string; // cursor
  includeTotal?: boolean;
};

// TODO: Shared
type RequestOpts = {
  signal?: AbortSignal;
};

// * ========== Query Endpoints ==========

/**
 * * GET ALL via Offset
 * Fetches a list of metric log entries, optionally filtered by metricId.
 * @deprecated Use cursor-based pagination instead (getMetricLogsViaCursor)
 */
export const getMetricLogs = async ({
  metricId,
  page = 1,
  limit = 20,
  startDate,
  endDate,
}: {
  metricId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<PaginatedMetricLogListResponseDTO> => {
  try {
    let url = `/metric-logs?page=${page}&limit=${limit}`;
    if (metricId) {
      url += `&metricId=${metricId}`;
    }
    if (startDate && startDate.trim() !== "") {
      url += `&startDate=${startDate}`;
    }
    if (endDate && endDate.trim() !== "") {
      url += `&endDate=${endDate}`;
    }

    const response = await api.get<
      ApiResponse<PaginatedMetricLogListResponseDTO>
    >(url);

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error fetching metric logs:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * GET ALL via Cursor
 * Fetches a list of metric log entries, optionally filtered by metricId.
 */
export async function getMetricLogsListViaCursor({
  limit = 20,
  sort = "-createdAt",
  q,
  filter,
  after,
  includeTotal = false,
}: ListLogsRequestParams): Promise<MetricLogCursorPageResponse> {
  const search = new URLSearchParams();

  search.set("limit", String(limit));
  search.set("sort", sort);

  if (q?.trim()) search.set("q", q.trim());
  if (filter?.name?.trim()) search.set("filter[name]", filter.name.trim());
  if (filter?.metricId?.trim())
    search.set("filter[metricId]", filter.metricId.trim());
  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const response = await api.get<ApiResponse<MetricLogCursorPageResponse>>(
    `/metric-logs?${search.toString()}`
  );

  return unwrap(response);
}

// * ========== Command Endpoints ==========

/**
 * * CREATE
 * Log a new metric entry
 */
export const createMetricLog = async (
  metricLog: CreateMetricLogRequestDTO
): Promise<MetricLogResponseDTO> => {
  console.log("logMetric called with metricLog:", metricLog);
  try {
    const response = await api.post<ApiResponse<MetricLogResponseDTO>>(
      "/metric-logs",
      metricLog
    );

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in logMetric:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * UPDATE
 * Update an existing metric log entry
 */
export const updateMetricLog = async ({
  metricLogId,
  metricLog,
}: {
  metricLogId: string;
  metricLog: UpdateMetricLogRequestDTO;
}): Promise<MetricLogResponseDTO> => {
  try {
    const response = await api.put<ApiResponse<MetricLogResponseDTO>>(
      `/metric-logs/${metricLogId}`,
      metricLog
    );

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in updateMetricLog:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * DELETE
 * Delete a metric log entry
 */
export const deleteMetricLog = async (
  metricLogId: string
): Promise<MetricLogResponseDTO> => {
  try {
    const response = await api.delete<ApiResponse<MetricLogResponseDTO>>(
      `/metric-logs/${metricLogId}`
    );

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in deleteMetricLog:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * ===== API Endopoints for Testing Purposes =====
 */

export const createMetricLogDummy = async (
  metric: GenerateDummyMetricLogsRequestDTO
): Promise<{ logs: MetricLogResponseDTO[] }> => {
  console.log("createMetricLogDummy called with metric:", metric);
  try {
    const response = await api.post<
      ApiResponse<{ logs: MetricLogResponseDTO[] }>
    >(`/metric-logs/${metric.metricId}/dummy`, metric);
    console.log("createMetricLogDummy response:", response.data);

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in generating Metric Dummy:", error);
    handleApiError(error);
    throw error;
  }
};
