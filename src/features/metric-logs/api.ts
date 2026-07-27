import type { CursorListParams } from "@/features/shared/api";
import { buildCursorQueryString } from "@/features/shared/api";
import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type {
  CreateMetricLogRequestDTO,
  GenerateDummyMetricLogsRequestDTO,
  MetricLogResponseDTO,
  PaginatedMetricLogListResponseDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

import type { MetricLogCursorPageResponse, MetricLogFilter, MetricLogSortParam } from "./sort";
import { DEFAULT_METRIC_LOG_SORT } from "./sort";

type ListLogsRequestParams = CursorListParams<MetricLogSortParam, MetricLogFilter>;

const BASE_URL = "/metric-logs";

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
    let url = `${BASE_URL}?page=${page}&limit=${limit}`;
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
export async function getMetricLogsListViaCursor(
  {
    limit = 20,
    sort = DEFAULT_METRIC_LOG_SORT,
    q,
    filter,
    after,
    includeTotal = false,
  }: ListLogsRequestParams,
  opts: RequestOpts = {},
): Promise<MetricLogCursorPageResponse> {
  return withApiErrorHandling(async () => {
    const query = buildCursorQueryString({
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const response = await api.get<ApiResponse<MetricLogCursorPageResponse>>(
      `${BASE_URL}${query}`,
      { signal: opts.signal, headers: opts.headers },
    );

    return unwrap(response);
  }, "getMetricLogsListViaCursor");
}

export const getMetricLogDetail = async (
  {
    logId,
    metricId,
  }: {
    logId: string;
    metricId: string;
  },
  opts: RequestOpts = {},
): Promise<MetricLogResponseDTO> =>
  withApiErrorHandling(async () => {
    const response = await api.get<ApiResponse<MetricLogResponseDTO>>(
      `${BASE_URL}/${logId}`,
      {
        signal: opts.signal,
        headers: opts.headers,
        params: { metricId },
      },
    );
    return unwrap(response);
  }, "getMetricLogDetail");

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
      headers: { ...headers, ...(opts.headers ?? {}) },
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
      `${BASE_URL}/${metricLogId}`,
      metricLog,
      { signal: opts.signal, headers: opts.headers },
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
      `${BASE_URL}/${metricLogId}`,
      { signal: opts.signal, headers: opts.headers },
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
      `${BASE_URL}/${metric.metricId}/dummy`,
      metric,
    );

    return unwrap(response);
  }, "createMetricLogDummy");
};
