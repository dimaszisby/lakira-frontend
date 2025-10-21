import type {AxiosResponse} from "axios";

type Status = "success" | "fail" | "error";

export type ApiSuccess<T> = {
  status: "success";
  message: string;
  data: T; // non-null on success
  code?: string | number;
  success?: true;
};

export type ApiFailure = {
  status: Exclude<Status, "success">; // example: "fail" | "error"
  message: string;
  data: null; // always null on non-success
  error?: string;
  errors?: string[];
  code?: string | number;
  success?: false;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export default ApiResponse;

// * ===== Helpers ======

export function unwrap<T>(r: AxiosResponse<ApiResponse<T>>): T {
  const body = r.data;
  if (body.status !== "success") {
    throw new Error(body.message || "Unexpected API response");
  }
  return body.data;
}

// Probe without throwing:
export function isSuccess<T>(
  r: AxiosResponse<ApiResponse<T>>
): r is AxiosResponse<ApiSuccess<T>> {
  return r.data?.status === "success";
}

// Optional convenience that doesn’t throw:
export function unwrapOrNull<T>(r: AxiosResponse<ApiResponse<T>>): T | null {
  return r.data?.status === "success" ? r.data.data : null;
}
