import type {
  GenerateDummyMetricsRequestDTO,
  MetricResponseDTO,
  UpdateMetricRequestDTO,
  UserMetricDetailResponseDTO,
} from "@/features/metrics/metric.dto";
import type { CreateMetricRequestDTO } from "@/features/metrics/metric.dto";
import type { PaginatedMetricListResponseDTO } from "@/features/metrics/metric.dto";
import type { CursorListParams } from "@/features/shared/api";
import { buildCursorQueryString, buildQueryString } from "@/features/shared/api";
import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

import { normalizeIncludes } from "./keys";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortParamViaCursor } from "./sort";
import { DEFAULT_METRIC_SORT, DEFAULT_METRIC_SORT_OFFSET, METRICS_PAGE_SIZE } from "./sort";
import type { IncludeKey, MetricsListParams } from "./types";

export type ListMetricParams = CursorListParams<MetricSortParamViaCursor, MetricFilterViaCursor>;

// * ========== Query Endpoints ==========

/**
 * Fetches the list of metrics from the API.
 * @returns {Promise<PaginatedMetricListResponseDTO>} - A promise that resolves to the list of metrics with pagination info.
 * @throws {Error} - If the API request fails.
 * @TODO: Implement caching, pagination, and ETag to improve performance.
 */
export async function getMetricLibraryList(
  params: MetricsListParams,
  opts: RequestOpts = {},
): Promise<PaginatedMetricListResponseDTO> {
  return withApiErrorHandling(async () => {
    const {
      page = 1,
      limit = METRICS_PAGE_SIZE,
      sortBy = DEFAULT_METRIC_SORT_OFFSET.sortBy,
      sortOrder = DEFAULT_METRIC_SORT_OFFSET.sortOrder,
      q,
      name,
      categoryId,
      isPublic,
    } = params ?? {};

    const query = buildQueryString({
      page,
      limit,
      sortBy,
      sortOrder,
      q,
      name,
      categoryId,
      isPublic,
    });

    const response = await api.get<ApiResponse<PaginatedMetricListResponseDTO>>(
      `/metrics${query}`,
      {
        signal: opts.signal,
        headers: opts.headers,
      },
    );

    return unwrap(response);
  }, "getMetricLibraryList");
}

// GET ALL via Cursor
export async function getMetricLibraryViaCursor(
  {
    limit = 20,
    sort = DEFAULT_METRIC_SORT,
    q,
    filter,
    after,
    includeTotal = false,
  }: ListMetricParams,
  opts: RequestOpts = {},
): Promise<MetricCursorPage> {
  return withApiErrorHandling(async () => {
    const query = buildCursorQueryString({
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const response = await api.get<ApiResponse<MetricCursorPage>>(`/metrics${query}`, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(response);
  }, "getMetricLibraryViaCursor");
}

/**
 * TODO: Currently not being part of the API MVP, but can be useful in the future
 * @description Get Metric Details that contains core metric information, will be mainly used for public metrics.
 */
export const getMetricDetails = async (
  metricId: string,
  opts: RequestOpts = {},
): Promise<MetricResponseDTO> =>
  withApiErrorHandling(async () => {
    const response = await api.get<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(response);
  }, "getMetricDetails");

/**
 * * GET Details with extended info
 * @description Get User Metric Details that contains extended metric information, will be mainly used for metric detail page.
 */
export const getUserMetricDetails = async (
  metricId: string,
  params: { includes?: IncludeKey[]; logsLimit?: number } = {},
  opts: RequestOpts = {},
): Promise<UserMetricDetailResponseDTO> => {
  return withApiErrorHandling(async () => {
    // Checks includes domains/entities
    const include = normalizeIncludes(params.includes ?? []);
    const query = buildQueryString({
      include, // undefined => server treats as "flat"
      logsLimit: params.logsLimit ?? 20,
    });

    const response = await api.get<ApiResponse<UserMetricDetailResponseDTO>>(
      `/metrics/${metricId}${query}`,
      { signal: opts.signal, headers: opts.headers },
    );

    return unwrap(response);
  }, "getUserMetricDetails");
};

// GET ALL metric names
// Currently have no use for this function, but it can be useful in the future
export const getAllMetricNames = async (opts: RequestOpts = {}): Promise<string[]> =>
  withApiErrorHandling(async () => {
    const response = await api.get<{ data: string[] }>("/metrics/names", {
      signal: opts.signal,
      headers: opts.headers,
    });
    return response.data.data;
  }, "getAllMetricNames");

// * ========== Commands Endpoints ==========

//  CREATE a new metric
export const createMetric = async (
  metric: CreateMetricRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {},
): Promise<MetricResponseDTO> => {
  return withApiErrorHandling(async () => {
    // Avoid dupplicates on retry
    const headers: Record<string, string> = {};
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

    const response = await api.post<ApiResponse<MetricResponseDTO>>("/metrics", metric, {
      signal: opts.signal,
      headers: { ...headers, ...(opts.headers ?? {}) },
    });

    return unwrap(response);
  }, "createMetric");
};

// UPDATE a metric
export async function updateMetric(
  args: { metricId: string; metric: UpdateMetricRequestDTO },
  opts: RequestOpts = {},
): Promise<MetricResponseDTO> {
  return withApiErrorHandling(async () => {
    const { metricId, metric } = args;
    const response = await api.put<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`, metric, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(response);
  }, "updateMetric");
}

// Delete a metric
export async function deleteMetric(
  metricId: string,
  opts: RequestOpts = {},
): Promise<MetricResponseDTO> {
  return withApiErrorHandling(async () => {
    const response = await api.delete<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(response);
  }, "deleteMetric");
}

/**
 * * ===== Testing Endpoints =====
 */

export async function createMetricDummy(
  payload: GenerateDummyMetricsRequestDTO,
  opts: RequestOpts = {},
): Promise<MetricResponseDTO[]> {
  return withApiErrorHandling(async () => {
    const res = await api.post<ApiResponse<MetricResponseDTO[]>>("/metrics/dummy", payload, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(res);
  }, "createMetricDummy");
}
