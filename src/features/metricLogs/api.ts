import { withApiErrorHandling } from "@/src/services/api/withApiErrorHandling";
import type {
  CreateMetricLogRequestDTO,
  GenerateDummyMetricLogsRequestDTO,
  MetricLogResponseDTO,
  PaginatedMetricLogListResponseDTO,
  UpdateMetricLogRequestDTO,
} from "@/src/types/dtos/metric-log.dto";
import type { RequestOpts } from "@/src/types/generics/RequestOpts";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";

import api from "../../services/api/api";
import type {
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
}): Promise<PaginatedMetricLogListResponseDTO> =>
  withApiErrorHandling(async () => {
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

    const response = await api.get<ApiResponse<PaginatedMetricLogListResponseDTO>>(url);

    return unwrap(response);
  }, "getMetricLogs");

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
  return withApiErrorHandling(async () => {
    const search = new URLSearchParams();

    search.set("limit", String(limit));
    search.set("sort", sort);

    if (q?.trim()) search.set("q", q.trim());
    if (filter?.name?.trim()) search.set("filter[name]", filter.name.trim());
    if (filter?.metricId?.trim()) search.set("filter[metricId]", filter.metricId.trim());
    if (after) search.set("after", after);
    if (includeTotal) search.set("includeTotal", "true");

    const response = await api.get<ApiResponse<MetricLogCursorPageResponse>>(
      `/metric-logs?${search.toString()}`,
    );

    return unwrap(response);
  }, "getMetricLogsListViaCursor");
}

// * ========== Command Endpoints ==========

// CREATE Log a new metric entry
export const createMetricLog = async (
  metricLog: CreateMetricLogRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {},
): Promise<MetricLogResponseDTO> => {
  return withApiErrorHandling(async () => {
    // Avoid dupplicates on retry
    const headers: Record<string, string> = {};
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

    const response = await api.post<ApiResponse<MetricLogResponseDTO>>("/metric-logs", metricLog, {
      signal: opts.signal,
      headers,
    });

    return unwrap(response);
  }, "createMetricLog");
};

// UPDATE an existing metric log entry
export const updateMetricLog = async (
  args: { metricLogId: string; metricLog: UpdateMetricLogRequestDTO },
  opts: RequestOpts = {},
): Promise<MetricLogResponseDTO> => {
  return withApiErrorHandling(async () => {
    const { metricLogId, metricLog } = args;

    const response = await api.put<ApiResponse<MetricLogResponseDTO>>(
      `/metric-logs/${metricLogId}`,
      metricLog,
      { signal: opts.signal },
    );

    return unwrap(response);
  }, "updateMetricLog");
};

// DELETE a metric log entry
export const deleteMetricLog = async (
  metricLogId: string,
  opts: RequestOpts = {},
): Promise<MetricLogResponseDTO> => {
  return withApiErrorHandling(async () => {
    const response = await api.delete<ApiResponse<MetricLogResponseDTO>>(
      `/metric-logs/${metricLogId}`,
      { signal: opts.signal },
    );

    return unwrap(response);
  }, "deleteMetricLog");
};

/**
 * * ===== API Endopoints for Testing Purposes =====
 */

export const createMetricLogDummy = async (
  metric: GenerateDummyMetricLogsRequestDTO,
): Promise<{ logs: MetricLogResponseDTO[] }> => {
  return withApiErrorHandling(async () => {
    const response = await api.post<ApiResponse<{ logs: MetricLogResponseDTO[] }>>(
      `/metric-logs/${metric.metricId}/dummy`,
      metric,
    );

    return unwrap(response);
  }, "createMetricLogDummy");
};
