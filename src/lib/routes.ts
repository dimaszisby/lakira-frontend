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

export type AuthRoutes = typeof authRoutes;
