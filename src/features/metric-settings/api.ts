import api from "@/services/api/api";
import { handleApiError } from "@/services/api/handleApiError";
import type {
  CreateMetricSettingsRequestDTO,
  DisplayOptionsDTO,
  MetricSettingsResponseDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/types/dtos/metric-settings.dto";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap } from "@/types/generics/ApiResponse";

import type {
  MetricSettingsCursorPageResponse,
  MetricSettingsFilter,
  MetricSettingsSortParam,
} from "./sort";
import { DEFAULT_METRIC_SETTINGS_SORT } from "./sort";

type ListSettingsRequestParams = {
  limit?: number; // default 20
  sort?: MetricSettingsSortParam;
  filter?: MetricSettingsFilter;
  after?: string; // cursor
  includeTotal?: boolean;
};

type RequestOpts = {
  signal?: AbortSignal;
};

/**
 * * CREATE
 * @description Create new metric settings.
 */
export const createMetricSettings = async (
  metricSettings: CreateMetricSettingsRequestDTO,
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.post<ApiResponse<MetricSettingsResponseDTO>>(
      "/metric-settings",
      metricSettings,
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in createMetricSettings:", error);
    handleApiError(error);
    throw error;
  }
};
/**
 * * GET All
 * @description Get all metric settings, optionally filtered by metricId.
 */
export const getAllMetricSettings = async (
  metricId?: string,
): Promise<MetricSettingsResponseDTO[]> => {
  try {
    let url = "/metric-settings";
    if (metricId) {
      url += `?metricId=${metricId}`;
    }
    const res = await api.get<ApiResponse<{ settings: MetricSettingsResponseDTO[] }>>(url);

    return unwrap(res).settings;
  } catch (error: unknown) {
    console.error("Error fetching metric settings:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * GET ALL via Cursor
 * Fetches a list of metric settings entries.
 */
export async function getMetricSettingsListViaCursor({
  limit = 20,
  sort = DEFAULT_METRIC_SETTINGS_SORT,
  filter,
  after,
  includeTotal = false,
}: ListSettingsRequestParams): Promise<MetricSettingsCursorPageResponse> {
  const search = new URLSearchParams();

  search.set("limit", String(limit));
  search.set("sort", sort);

  if (filter?.metricId?.trim()) search.set("filter[metricId]", filter.metricId.trim());
  if (after) search.set("after", after);
  if (includeTotal) search.set("includeTotal", "true");

  const response = await api.get<ApiResponse<MetricSettingsCursorPageResponse>>(
    `/metric-settings?${search.toString()}`,
  );

  return unwrap(response);
}

/**
 * * GET By Id
 * @description Get a specific metric settings by ID.
 */
export const getMetricSettingsById = async (
  id: string,
  metricId: string,
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.get<ApiResponse<{ settings: MetricSettingsResponseDTO }>>(
      `/metric-settings/${id}?metricId=${metricId}`,
    );

    return unwrap(res).settings;
  } catch (error: unknown) {
    console.error("Error fetching metric settings by ID:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * UPDATE
 * @description Update a specific metric settings by ID.
 */
export const updateMetricSettings = async (
  id: string,
  metricId: string,
  metricSettings: UpdateMetricSettingsRequestDTO,
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.put<ApiResponse<MetricSettingsResponseDTO>>(
      `/metric-settings/${id}?metricId=${metricId}`,
      metricSettings,
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in updateMetricSettings:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * DELETE
 * @description Delete a specific metric settings by ID.
 */
export const deleteMetricSettings = async (
  id: string,
  metricId: string,
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.delete<ApiResponse<MetricSettingsResponseDTO>>(
      `/metric-settings/${id}?metricId=${metricId}`,
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in deleteMetricSettings:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * PATCH goal achievements
 * @description Update goal achievement status for metric settings.
 */
export const updateGoalAchievement = async (
  id: string,
  metricId: string,
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.patch<ApiResponse<MetricSettingsResponseDTO>>(
      `/metric-settings/${id}/achieve?metricId=${metricId}`,
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in updateGoalAchievement:", error);
    handleApiError(error);
    throw error;
  }
};

/**
 * * PATCH display
 * @description Update display options for metric settings.
 */
export const updateDisplayOptions = async (
  id: string,
  metricId: string,
  displayOptions: DisplayOptionsDTO,
  opts: RequestOpts = {},
): Promise<MetricSettingsResponseDTO> => {
  try {
    const res = await api.patch<ApiResponse<MetricSettingsResponseDTO>>(
      `/metric-settings/${id}/display?metricId=${metricId}`,
      { displayOptions },
      { signal: opts.signal },
    );

    return unwrap(res);
  } catch (error: unknown) {
    console.error("Error in updateDisplayOptions:", error);
    handleApiError(error);
    throw error;
  }
};
