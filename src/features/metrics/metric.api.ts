import type {
  GenerateDummyMetricsRequestDTO,
  MetricResponseDTO,
  UpdateMetricRequestDTO,
  UserMetricDetailResponseDTO,
} from "@/features/metrics/metric.dto";
import type { CreateMetricRequestDTO } from "@/features/metrics/metric.dto";
import type { PaginatedMetricListResponseDTO } from "@/features/metrics/metric.dto";
import api from "@/services/api/api";
import { handleApiError } from "@/services/api/handleApiError";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";

import { normalizeIncludes } from "./keys";
import type { MetricCursorPage, MetricFilterViaCursor, MetricSortParamViaCursor } from "./sort";
import { DEFAULT_METRIC_SORT, DEFAULT_METRIC_SORT_OFFSET, METRICS_PAGE_SIZE } from "./sort";
import type { IncludeKey, MetricsListParams } from "./types";

// TODO: Generic Function
export type ListMetricParams = {
  limit?: number; // default 20
  sort?: MetricSortParamViaCursor;
  q?: string;
  filter?: MetricFilterViaCursor;
  after?: string; // cursor
  includeTotal?: boolean;
};

// TODO: Shared
type RequestOpts = {
  signal?: AbortSignal;
};

/** Build query string without undefined/null and with stable ordering */
// TODO: Shared Function
function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.keys(params)
    .sort()
    .forEach((k) => {
      const v = params[k];
      if (v === undefined || v === null || v === "") return;
      qs.set(k, String(v));
    });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

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

  const query = buildQuery({
    page,
    limit,
    sortBy,
    sortOrder,
    q,
    name,
    categoryId,
    isPublic,
  });

  const response = await api.get<ApiResponse<PaginatedMetricListResponseDTO>>(`/metrics${query}`, {
    signal: opts.signal,
  });

  return unwrap(response);
}

// GET ALL via Cursor
export async function getMetricLibraryViaCursor({
  limit = 20,
  sort = DEFAULT_METRIC_SORT,
  q,
  filter,
  after,
  includeTotal = false,
}: ListMetricParams): Promise<MetricCursorPage> {
  const search = new URLSearchParams();

  search.set("limit", String(limit));
  search.set("sort", sort);

  if (q?.trim()) search.set("q", q.trim());
  if (filter?.name?.trim()) search.set("filter[name]", filter.name.trim());
  if (filter?.categoryId?.trim()) search.set("filter[categoryId]", filter.categoryId.trim());
  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const response = await api.get<ApiResponse<MetricCursorPage>>(`/metrics?${search.toString()}`);

  return unwrap(response);
}

/**
 * TODO: Currently not being part of the API MVP, but can be useful in the future
 * @description Get Metric Details that contains core metric information, will be mainly used for public metrics.
 */
export const getMetricDetails = async (metricId: string): Promise<MetricResponseDTO> => {
  try {
    const response = await api.get<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`);

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in getMetricDetails:", error);
    handleApiError(error); // Ensure handleApiError is called
    throw error;
  }
};

/**
 * * GET Details with extended info
 * @description Get User Metric Details that contains extended metric information, will be mainly used for metric detail page.
 */
export const getUserMetricDetails = async (
  metricId: string,
  params: { includes?: IncludeKey[]; logsLimit?: number } = {},
  opts: RequestOpts = {},
): Promise<UserMetricDetailResponseDTO> => {
  // Checks includes domains/entities
  const include = normalizeIncludes(params.includes ?? []);
  const query = buildQuery({
    include, // undefined => server treats as "flat"
    logsLimit: params.logsLimit ?? 20,
  });

  try {
    const response = await api.get<ApiResponse<UserMetricDetailResponseDTO>>(
      `/metrics/${metricId}${query}`,
      { signal: opts.signal },
    );

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in getUserMetricDetails:", error);
    handleApiError(error);
    throw error;
  }
};

// GET ALL metric names
// Currently have no use for this function, but it can be useful in the future
export const getAllMetricNames = async (): Promise<string[]> => {
  try {
    const response = await api.get("/metrics/names");
    return response.data.data;
  } catch (error: unknown) {
    handleApiError(error);
    throw error;
  }
};

// * ========== Commands Endpoints ==========

//  CREATE a new metric
export const createMetric = async (
  metric: CreateMetricRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {},
): Promise<MetricResponseDTO> => {
  // Avoid dupplicates on retry
  const headers: Record<string, string> = {};
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const response = await api.post<ApiResponse<MetricResponseDTO>>("/metrics", metric, {
    signal: opts.signal,
    headers,
  });

  return unwrap(response);
};

// UPDATE a metric
export async function updateMetric(
  args: { metricId: string; metric: UpdateMetricRequestDTO },
  opts: RequestOpts = {},
): Promise<MetricResponseDTO> {
  const { metricId, metric } = args;
  try {
    const response = await api.put<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`, metric, {
      signal: opts.signal,
    });

    return unwrap(response);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Delete a metric
export async function deleteMetric(
  metricId: string,
  opts: RequestOpts = {},
): Promise<MetricResponseDTO> {
  try {
    const response = await api.delete<ApiResponse<MetricResponseDTO>>(`/metrics/${metricId}`, {
      signal: opts.signal,
    });

    return unwrap(response);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * * ===== Testing Endpoints =====
 */

export async function createMetricDummy(
  payload: GenerateDummyMetricsRequestDTO,
  opts: RequestOpts = {},
): Promise<MetricResponseDTO[]> {
  try {
    const res = await api.post<ApiResponse<MetricResponseDTO[]>>("/metrics/dummy", payload, {
      signal: opts.signal,
    });

    return unwrap(res);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
