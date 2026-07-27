// utils/api.ts

import axios from "axios";
import axiosRetry, { isNetworkOrIdempotentRequestError } from "axios-retry";

/**
 * Api Client using Axios
 */

const API_PROXY_PATH = "/api/proxy";

function normalizeBaseUrlCandidate(raw?: string | null) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

function resolveBaseUrl() {
  if (typeof window !== "undefined") return API_PROXY_PATH;

  const envOrigin =
    normalizeBaseUrlCandidate(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrlCandidate(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeBaseUrlCandidate(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    normalizeBaseUrlCandidate(process.env.VERCEL_URL);

  if (envOrigin) {
    return new URL(API_PROXY_PATH, envOrigin).toString();
  }

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = (process.env.HOST ?? "localhost").replace(/\/$/, "");
  const portSegment = host.includes(":") ? "" : `:${process.env.PORT ?? "3000"}`;
  const fallbackOrigin = `${protocol}://${host}${portSegment}`;
  return new URL(API_PROXY_PATH, fallbackOrigin).toString();
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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
