// utils/api.ts

import axios from "axios";
import axiosRetry, { isNetworkOrIdempotentRequestError } from "axios-retry";

/**
 * Api Client using Axios
 */

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth header (browser-only)
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 401 handling (logout flow stays in callers / router)
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);

// Add a response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear the token from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      // Re-throw the error so it can be caught by individual API calls (e.g., in withAuth)
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

// Retry policy
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // backoff + jitter
  retryCondition: (error) => {
    const method = (error.config?.method || "").toUpperCase();
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
    const hasIdemKey = !!error.config?.headers?.["Idempotency-Key"];

    // Network issues or 429/5xx
    const retriableServer =
      (error.response?.status ?? 0) === 429 || (error.response?.status ?? 0) >= 500;

    if (isSafeMethod) {
      return isNetworkOrIdempotentRequestError(error) || retriableServer;
    }
    // Allow retrying POST/PUT only if caller provided idempotency key
    if (hasIdemKey) {
      return isNetworkOrIdempotentRequestError(error) || retriableServer;
    }
    return false;
  },
});

/** ----------------------------------------------------------------
 * Axios instance (timeouts, auth, baseURL, retries, ETag support)
 * ---------------------------------------------------------------- */

// Simple ETag cache (per-process)
// const etagStore = new Map<string, { etag: string; body: unknown }>();

// api.interceptors.request.use((config) => {
//   if (!config.method || config.method.toUpperCase() !== "GET") return config;
//   const key = `${config.method}:${config.baseURL}${
//     config.url
//   }?${new URLSearchParams(
//     (config.params as Record<string, string | number | boolean>) ?? {}
//   ).toString()}`;
//   const cached = etagStore.get(key);
//   if (cached?.etag) {
//     config.headers = { ...config.headers, "If-None-Match": cached.etag };
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (resp) => {
//     // cache ETag bodies for GETs
//     if (resp.config.method?.toUpperCase() === "GET") {
//       const key = `${resp.config.method}:${resp.config.baseURL}${
//         resp.config.url
//       }?${new URLSearchParams((resp.config.params as any) ?? {}).toString()}`;
//       const etag = resp.headers?.etag;
//       if (etag) etagStore.set(key, { etag, body: resp.data });
//     }
//     return resp;
//   },
//   async (error) => {
//     // If 304, return cached body as a fulfilled promise
//     const resp = error?.response as AxiosResponse | undefined;
//     if (resp?.status === 304) {
//       const key = `${resp.config.method}:${resp.config.baseURL}${
//         resp.config.url
//       }?${new URLSearchParams((resp.config.params as any) ?? {}).toString()}`;
//       const cached = etagStore.get(key);
//       if (cached) return { ...resp, status: 200, data: cached.body };
//     }
//     return Promise.reject(error);
//   }
// );

// Retries (safe + throttling). For POSTs use idempotency keys (see createMetric).

export default api;
