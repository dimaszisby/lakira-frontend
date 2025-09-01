import {
  MetricResponseDTO,
  GenerateDummyMetricsRequestDTO,
  UserMetricDetailResponseDTO,
  UpdateMetricRequestDTO,
} from "@/src/features/metrics/metric.dto";
import { CreateMetricRequestDTO } from "@/src/features/metrics/metric.dto";
import ApiResponse, { unwrap } from "@/types/generics/ApiResponse";
import { PaginatedMetricListResponseDTO } from "@/src/features/metrics/metric.dto";
import { handleApiError } from "@/src/services/api/handleApiError";
import api from "@/src/services/api/api";
import { IncludeKey, MetricsListParams } from "./types";
import {
  DEFAULT_METRIC_SORT,
  MetricCursorPage,
  MetricFilterViaCursor,
  METRICS_PAGE_SIZE,
  MetricSortViaCursor,
} from "./sort";
import { normalizeIncludes } from "./keys";

// TODO: Generic Function
export type ListMetricParams = {
  limit?: number; // default 20
  sort?: MetricSortViaCursor;
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

// * ========== APIs Interactors ==========

/**
 * Create a new metric
 * @param {CreateMetricRequestDTO} metric - The metric data to create.
 * @returns {Promise<MetricResponseDTO>} - A promise that resolves to the created metric.
 * @throws {Error} - If the API request fails.
 */
export const createMetric = async (
  metric: CreateMetricRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {}
): Promise<MetricResponseDTO> => {
  // Avoid dupplicates on retry
  const headers: Record<string, string> = {};
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const response = await api.post<ApiResponse<MetricResponseDTO>>(
    "/metrics",
    metric,
    { signal: opts.signal, headers }
  );

  return unwrap(response);
};

// * TODO: Currently have no use for this function, but it can be useful in the future
export const getAllMetricNames = async (): Promise<string[]> => {
  try {
    const response = await api.get("/metrics/names");
    return response.data.data;
  } catch (error: unknown) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Fetches the list of metrics from the API.
 * @returns {Promise<PaginatedMetricListResponseDTO>} - A promise that resolves to the list of metrics with pagination info.
 * @throws {Error} - If the API request fails.
 * @TODO: Implement caching, pagination, and ETag to improve performance.
 */
export async function getMetricLibraryList(
  params: MetricsListParams,
  opts: RequestOpts = {}
): Promise<PaginatedMetricListResponseDTO> {
  const {
    page = 1,
    limit = METRICS_PAGE_SIZE,
    sortBy = DEFAULT_METRIC_SORT.sortBy,
    sortOrder = DEFAULT_METRIC_SORT.sortOrder,
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

  const response = await api.get<ApiResponse<PaginatedMetricListResponseDTO>>(
    `/metrics${query}`,
    { signal: opts.signal }
  );

  return unwrap(response);
}

export async function getMetricLibraryViaCursor({
  limit = 20,
  sort = "-createdAt",
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
  if (filter?.categoryId?.trim())
    search.set("filter[categoryId]", filter.categoryId.trim());
  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const response = await api.get<ApiResponse<MetricCursorPage>>(
    `/metrics?${search.toString()}`
  );

  return unwrap(response);
}

/**
 * * TODO: Currently not being part of the API MVP, but can be useful in the future
 * Get Metric Details that contains core metric information, will be mainly used for public metrics.
 * @param {string} metricId - The ID of the metric to retrieve.
 * @returns {Promise<MetricResponseDTO>} - A promise that resolves to the metric details.
 */
export const getMetricDetails = async (
  metricId: string
): Promise<MetricResponseDTO> => {
  try {
    const response = await api.get<ApiResponse<MetricResponseDTO>>(
      `/metrics/${metricId}`
    );

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in getMetricDetails:", error);
    handleApiError(error); // Ensure handleApiError is called
    throw error;
  }
};

/**
 * Get User Metric Details that contains extended metric information, will be mainly used for metric detail page.
 * @param {string} metricId - The ID of the metric to retrieve.
 * @returns {Promise<UserMetricDetailResponseDTO>} - A promise that resolves to the metric details (extended).
 */
export const getUserMetricDetails = async (
  metricId: string,
  params: { includes?: IncludeKey[]; logsLimit?: number } = {},
  opts: RequestOpts = {}
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
      { signal: opts.signal }
    );

    console.log("------ RESPONSE,", response);

    return unwrap(response);
  } catch (error: unknown) {
    console.error("Error in getUserMetricDetails:", error);
    handleApiError(error); // Ensure handleApiError is called
    throw error;
  }
};

/**
 * Update a metric
 * @param {UpdateMetricRequestDTO} metric - The metric data to update.
 * @returns {Promise<MetricResponseDTO>} - A promise that resolves to the updated metric.
 * @throws {Error} - If the API request fails.
 */
export async function updateMetric(
  args: { metricId: string; metric: UpdateMetricRequestDTO },
  opts: RequestOpts = {}
): Promise<MetricResponseDTO> {
  const { metricId, metric } = args;
  try {
    const response = await api.put<ApiResponse<MetricResponseDTO>>(
      `/metrics/${metricId}`,
      metric,
      { signal: opts.signal }
    );

    return unwrap(response);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Delete a metric
 * @param {string} metricId - The ID of the metric to delete.
 * @returns {Promise<MetricResponseDTO>} - A promise that resolves to the deleted metric.
 * @throws {Error} - If the API request fails.
 */
export async function deleteMetric(
  metricId: string,
  opts: RequestOpts = {}
): Promise<MetricResponseDTO> {
  try {
    const response = await api.delete<ApiResponse<MetricResponseDTO>>(
      `/metrics/${metricId}`,
      { signal: opts.signal }
    );

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
  opts: RequestOpts = {}
): Promise<MetricResponseDTO[]> {
  try {
    const res = await api.post<ApiResponse<MetricResponseDTO[]>>(
      "/metrics/dummy",
      payload,
      { signal: opts.signal }
    );

    return unwrap(res);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
