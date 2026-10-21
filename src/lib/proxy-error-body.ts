/**
 * What of a backend error body the API proxy lets through to the browser (ADR-0034).
 *
 * An allowlist, for the reason the proxy's paths are deny-by-default: a key the
 * backend adds later is inert here until someone lists it, rather than shipped
 * until someone notices. The backend gates `stack` to development and masks 5xx
 * messages, but that is a check this app cannot enforce or test.
 *
 * The allowlist must stay a superset of what `normalizeApiError`
 * (`src/services/api/normalizeApiError.ts`) reads, or a message the UI shows would
 * vanish. `src/lib/__tests__/proxy-error-body.test.ts` compares the two. To show
 * a new key, add it here and to that test.
 */

/** Larger than any error envelope the backend writes; past it the body is not read. */
export const MAX_ERROR_BODY_BYTES = 64 * 1024;

/** Top-level keys kept as they are, when they are strings. */
const STRING_KEYS = ["status", "message", "error", "code"] as const;

type ErrorItem = string | { field?: string; message: string };

type FilteredErrorBody = Partial<Record<(typeof STRING_KEYS)[number], string>> & {
  errors?: ErrorItem[];
  issues?: { message: string }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringAt = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

/** The backend's `{ field, message }` issues, and plain strings, which the frontend also reads. */
const filterErrors = (items: unknown[]): ErrorItem[] =>
  items.flatMap<ErrorItem>((item) => {
    if (typeof item === "string") return [item];
    if (!isRecord(item)) return [];

    const message = stringAt(item, "message");
    if (message === undefined) return [];

    const field = stringAt(item, "field");
    return [field === undefined ? { message } : { field, message }];
  });

/** Zod-shaped `issues`; only each issue's message is read. */
const filterIssues = (items: unknown[]): { message: string }[] =>
  items.flatMap<{ message: string }>((item) => {
    const message = isRecord(item) ? stringAt(item, "message") : undefined;
    return message === undefined ? [] : [{ message }];
  });

/**
 * The error body rebuilt from the allowlist, as JSON, or `null` when it is not a
 * JSON object at all, which the proxy then drops.
 */
export const filterErrorBody = (text: string): string | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const filtered: FilteredErrorBody = {};
  for (const key of STRING_KEYS) {
    const value = stringAt(parsed, key);
    if (value !== undefined) filtered[key] = value;
  }

  const { errors, issues } = parsed;
  if (Array.isArray(errors)) filtered.errors = filterErrors(errors);
  if (Array.isArray(issues)) filtered.issues = filterIssues(issues);

  return JSON.stringify(filtered);
};
