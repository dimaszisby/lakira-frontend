import type { CursorListParams } from "@/features/shared/api";
import { buildCursorQueryString } from "@/features/shared/api";
import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type {
  CreateMetricCategoryRequestDTO,
  GenerateDummyMetricCategoriesRequestDTO,
  MetricCategoryResponseDTO,
  PaginatedMetricCategoryListResponseDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/types/dtos/metric-category.dto";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";
import type { RequestOpts } from "@/types/generics/RequestOpts";

import type {
  MetricCategoryCursorPage,
  MetricCategoryFilter,
  MetricCategorySortParam,
} from "./sort";
import { DEFAULT_METRIC_CATEGORY_SORT } from "./sort";

export type ListCategoryParams = CursorListParams<
  MetricCategorySortParam,
  MetricCategoryFilter
>;

// * ========== Queries ==========

/**
 * * GET List via Cursor
 * @description Fetches the list of metric categories from the API.
 */
export async function listMetricCategories(
  {
    limit = 20,
    sort = DEFAULT_METRIC_CATEGORY_SORT,
    q,
    filter,
    after,
    includeTotal = false,
  }: ListCategoryParams,
  opts: RequestOpts = {},
): Promise<MetricCategoryCursorPage> {
  return withApiErrorHandling(async () => {
    const query = buildCursorQueryString({
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const res = await api.get<ApiResponse<MetricCategoryCursorPage>>(
      `/metric-categories${query}`,
      { signal: opts.signal, headers: opts.headers },
    );

    return unwrap(res);
  }, "listMetricCategories");
}

/**
 * Fetches the list of metric categories from the API.
 * @deprecated currently not being used, migrating to cursor method
 */
export const getMetricCategoryLibraries = async ({
  page = 1,
  limit = 20,
  sortBy = "createdAt", // default
  sortOrder = "DESC", // default
}: {
  metricId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC" | null;
}): Promise<PaginatedMetricCategoryListResponseDTO> =>
  withApiErrorHandling(async () => {
    let url = `/metric-categories?page=${page}&limit=${limit}`;

    if (sortBy) {
      url += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      url += `&sortOrder=${sortOrder}`;
    }

    const res = await api.get<ApiResponse<PaginatedMetricCategoryListResponseDTO>>(url);

    return unwrap(res);
  }, "getMetricCategoryLibraries");

/**
 * * GET by ID
 * @description Fetches a single metric category by its ID.
 */
export const getMetricCategoryById = async (
  id: string,
  opts: RequestOpts = {},
): Promise<MetricCategoryResponseDTO> =>
  withApiErrorHandling(async () => {
    const res = await api.get<ApiResponse<MetricCategoryResponseDTO>>(`/metric-categories/${id}`, {
      signal: opts.signal,
      headers: opts.headers,
    });

    return unwrap(res);
  }, "getMetricCategoryById");

// * ========== Mutations ==========

/**
 * * CREATE
 * @description Fetches the list of metric categories from the API.
 */
export const createMetricCategory = async (
  category: CreateMetricCategoryRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {},
): Promise<MetricCategoryResponseDTO> => {
  const headers: Record<string, string> = {};
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  return withApiErrorHandling(async () => {
    const res = await api.post<ApiResponse<MetricCategoryResponseDTO>>(
      "/metric-categories",
      category,
      { signal: opts.signal, headers: { ...headers, ...(opts.headers ?? {}) } },
    );

    return unwrap(res);
  }, "createMetricCategory");
};

/**
 * * UPDATE
 * @description Updates an existing metric category by its ID.
 */
export const updateMetricCategory = async (
  args: { categoryId: string; category: UpdateMetricCategoryRequestDTO },
  opts: RequestOpts = {},
): Promise<MetricCategoryResponseDTO> =>
  withApiErrorHandling(async () => {
    const res = await api.put<ApiResponse<MetricCategoryResponseDTO>>(
      `/metric-categories/${args.categoryId}`,
      args.category,
      { signal: opts.signal, headers: opts.headers },
    );

    return unwrap(res);
  }, "updateMetricCategory");

/**
 * * DELETE
 * @description a metric category by its ID.
 */
export const deleteMetricCategory = async (
  id: string,
  opts: RequestOpts = {},
): Promise<MetricCategoryResponseDTO> =>
  withApiErrorHandling(async () => {
    const res = await api.delete<ApiResponse<MetricCategoryResponseDTO>>(`/metric-categories/${id}`, {
      signal: opts.signal,
      headers: opts.headers,
    });
    return unwrap(res);
  }, "deleteMetricCategory");

/**
 * * ===== API Endopoints for Testing Purposes =====
 */

export const createMetricCategoryDummy = async (
  category: GenerateDummyMetricCategoriesRequestDTO,
): Promise<{ categories: MetricCategoryResponseDTO[] }> =>
  withApiErrorHandling(async () => {
    const res = await api.post<ApiResponse<{ categories: MetricCategoryResponseDTO[] }>>(
      "/metric-categories/dummy",
      category,
    );

    return unwrap(res) ?? { categories: [] };
  }, "createMetricCategoryDummy");
