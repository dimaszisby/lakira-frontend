import {
  CreateMetricCategoryRequestDTO,
  GenerateDummyMetricCategoriesRequestDTO,
  MetricCategoryResponseDTO,
  PaginatedMetricCategoryListResponseDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/src/types/dtos/metric-category.dto";
import ApiResponse, { unwrap } from "@/src/types/generics/ApiResponse";
import api from "../../services/api/api";
import {
  MetricCategoryCursorPage,
  MetricCategoryFilter,
  MetricCategorySort,
} from "./sort";
import { handleApiError } from "@/src/services/api/handleApiError";

// Developer Note: Should this replaced with generics?
export type ListCategoryParams = {
  limit?: number; // default 50
  sort?: MetricCategorySort;
  q?: string;
  filter?: MetricCategoryFilter;
  after?: string;
  includeTotal?: boolean;
};

// TODO: Shared
type RequestOpts = {
  signal?: AbortSignal;
};

// * ========== Queries ==========

/**
 * * GET List via Cursor
 * @description Fetches the list of metric categories from the API.
 */
export async function listMetricCategories({
  limit = 20,
  sort = "-createdAt",
  q,
  filter,
  after,
  includeTotal = false,
}: ListCategoryParams): Promise<MetricCategoryCursorPage> {
  const search = new URLSearchParams();

  search.set("limit", String(limit));
  search.set("sort", sort);

  if (q?.trim()) search.set("q", q.trim());
  if (filter?.name?.trim()) search.set("filter[name]", filter.name.trim());
  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const res = await api.get<ApiResponse<MetricCategoryCursorPage>>(
    `/metric-categories?${search.toString()}`
  );

  return unwrap(res);
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
}): Promise<PaginatedMetricCategoryListResponseDTO> => {
  try {
    let url = `/metric-categories?page=${page}&limit=${limit}`;

    if (sortBy) {
      url += `&sortBy=${sortBy}`;
    }
    if (sortOrder) {
      url += `&sortOrder=${sortOrder}`;
    }

    const res = await api.get<
      ApiResponse<PaginatedMetricCategoryListResponseDTO>
    >(url);

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error fetching metric library list:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * GET by ID
 * @description Fetches a single metric category by its ID.
 */
export const getMetricCategoryById = async (
  id: string,
  opts: RequestOpts = {}
): Promise<MetricCategoryResponseDTO> => {
  try {
    const res = await api.get<ApiResponse<MetricCategoryResponseDTO>>(
      `/metric-categories/${id}`,
      { signal: opts.signal }
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error(`Error fetching metric category with ID ${id}:`, error);
    handleApiError(error);
    throw error;
  }
};

// * ========== Mutations ==========

/**
 * * CREATE
 * @description Fetches the list of metric categories from the API.
 */
export const createMetricCategory = async (
  category: CreateMetricCategoryRequestDTO,
  opts: RequestOpts & { idempotencyKey?: string } = {}
): Promise<MetricCategoryResponseDTO> => {
  const headers: Record<string, string> = {};
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  try {
    const res = await api.post<ApiResponse<MetricCategoryResponseDTO>>(
      "/metric-categories",
      category,
      { signal: opts.signal, headers }
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in createMetric:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * UPDATE
 * @description Updates an existing metric category by its ID.
 */
export const updateMetricCategory = async (
  args: { categoryId: string; category: UpdateMetricCategoryRequestDTO },
  opts: RequestOpts = {}
): Promise<MetricCategoryResponseDTO> => {
  try {
    const res = await api.put<ApiResponse<MetricCategoryResponseDTO>>(
      `/metric-categories/${args.categoryId}`,
      args.category,
      { signal: opts.signal }
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error(
      `Error updating metric category with ID ${args.categoryId}:`,
      error
    );
    handleApiError(error);
    throw error;
  }
};

/**
 * * DELETE
 * @description a metric category by its ID.
 */
export const deleteMetricCategory = async (
  id: string,
  opts: RequestOpts = {}
): Promise<MetricCategoryResponseDTO> => {
  try {
    const res = await api.delete(`/metric-categories/${id}`, {
      signal: opts.signal,
    });
    return unwrap(res);
  } catch (error: unknown) {
    console.error(`Error deleting metric category with ID ${id}:`, error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * ===== API Endopoints for Testing Purposes =====
 */

export const createMetricCategoryDummy = async (
  category: GenerateDummyMetricCategoriesRequestDTO
): Promise<{ categories: MetricCategoryResponseDTO[] }> => {
  console.log("createMetricCategoryDummy called with category:", category);
  try {
    const res = await api.post<
      ApiResponse<{ categories: MetricCategoryResponseDTO[] }>
    >("/metric-categories/dummy", category);

    return unwrap(res) ?? { categories: [] };
  } catch (error: unknown) {
    console.error("Error in generating Metric Dummy:", error);
    handleApiError(error);
    throw error;
  }
};
