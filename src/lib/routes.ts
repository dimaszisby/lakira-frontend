type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | QueryValue[] | { [key: string]: QueryValue };
export type QueryParams = Record<string, QueryValue>;

const BOOLEAN_MAP: Record<string, string> = {
  true: "true",
  false: "false",
};

const isObject = (value: QueryValue): value is { [key: string]: QueryValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const serialize = (
  key: string,
  value: QueryValue,
  entries: Array<[string, string]>,
): void => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item) => serialize(`${key}[]`, item, entries));
    return;
  }

  if (isObject(value)) {
    Object.keys(value)
      .sort()
      .forEach((childKey) => {
        serialize(`${key}[${childKey}]`, value[childKey], entries);
      });
    return;
  }

  const stringValue =
    typeof value === "boolean" ? BOOLEAN_MAP[String(value)] : String(value);
  entries.push([key, stringValue]);
};

export const buildPath = (basePath: string, query?: QueryParams): string => {
  if (!query) return basePath;

  const entries: Array<[string, string]> = [];

  Object.keys(query)
    .sort()
    .forEach((key) => {
      serialize(key, query[key], entries);
    });

  if (!entries.length) return basePath;

  const queryString = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return `${basePath}${basePath.includes("?") ? "&" : "?"}${queryString}`;
};

const isSafeRelativePath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//");

const resolveReturnUrl = (returnUrl?: string | null): string | undefined => {
  if (!returnUrl) return undefined;
  return isSafeRelativePath(returnUrl) ? returnUrl : undefined;
};

export const authRoutes = {
  login: (returnUrl?: string | null) => {
    const safeReturnUrl = resolveReturnUrl(returnUrl);
    return buildPath("/login", safeReturnUrl ? { returnUrl: safeReturnUrl } : undefined);
  },
  register: (returnUrl?: string | null) => {
    const safeReturnUrl = resolveReturnUrl(returnUrl);
    return buildPath("/register", safeReturnUrl ? { returnUrl: safeReturnUrl } : undefined);
  },
  account: () => "/account",
  afterAuth: (returnUrl?: string | null) => resolveReturnUrl(returnUrl) ?? "/dashboard",
};

export const metricRoutes = {
  list: (params?: QueryParams) => buildPath("/metrics", params),
  detail: (metricId: string) => `/metrics/${metricId}`,
  overview: (metricId: string, params?: QueryParams) =>
    buildPath(`/metrics/${metricId}`, params),
  logs: (metricId: string, params?: QueryParams) =>
    buildPath(`/metrics/${metricId}/logs`, params),
  settings: (metricId: string, params?: QueryParams) =>
    buildPath(`/metrics/${metricId}/settings`, params),
  modal: {
    new: () => "/metrics/new",
    edit: (metricId: string) => `/metrics/${metricId}/edit`,
    log: (metricId: string, logId?: string) =>
      `/metrics/${metricId}/logs/${logId ?? "new"}`,
  },
};

export const metricCategoryRoutes = {
  list: (params?: QueryParams) => buildPath("/metric-categories", params),
  detail: (categoryId: string, params?: QueryParams) =>
    buildPath(`/metric-categories/${categoryId}`, params),
  modal: {
    new: () => "/metric-categories/new",
    edit: (categoryId: string) => `/metric-categories/${categoryId}/edit`,
  },
};

export const dashboardRoute = (params?: QueryParams) => buildPath("/dashboard", params);

export type AuthRoutes = typeof authRoutes;
export type MetricRoutes = typeof metricRoutes;
export type MetricCategoryRoutes = typeof metricCategoryRoutes;
