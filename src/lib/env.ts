import { z } from "zod";

/**
 * Environment access for the whole app. Read variables from here, not from
 * `process.env` scattered through feature code.
 *
 * The module has two segments:
 *
 * - **Public** (`clientEnv`) — `NEXT_PUBLIC_*` only. Inlined into the client
 *   bundle at build time and readable by anyone who loads the page. It is
 *   published content, not configuration. Never add a secret here.
 * - **Server** (`getApiBaseUrl`) — read only inside route handlers, server
 *   components, and middleware. Calling it in the browser throws.
 *
 * Each variable is referenced as a **literal** `process.env.X`. Next.js
 * substitutes those literals at build time; a dynamic lookup like
 * `process.env[name]` is not substituted and resolves to `undefined`.
 *
 * ## Why parsing is lenient
 *
 * Every field is optional and nothing throws at module load. `npm run build`
 * runs in CI with no environment set at all, so a schema that threw here would
 * fail the build gate. Values that are genuinely required are enforced at the
 * point of use, where a missing value fails loudly against a real request
 * rather than silently becoming `undefined` in a URL.
 */

/* -------------------------------------------------------------------------- */
/* Public segment                                                             */
/* -------------------------------------------------------------------------- */

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: optionalText,
  NEXT_PUBLIC_APP_URL: optionalText,
  NEXT_PUBLIC_SITE_URL: optionalText,
  NEXT_PUBLIC_VERCEL_URL: optionalText,
  NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const clientParse = ClientEnvSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: process.env.NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS,
});

if (!clientParse.success && process.env.NODE_ENV !== "production") {
  console.warn(
    "[env] Invalid NEXT_PUBLIC_* environment:",
    clientParse.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  );
}

export const clientEnv = clientParse.success
  ? clientParse.data
  : {
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_VERCEL_URL: undefined,
      NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: false,
    };

/** Gates the "generate dummy data" affordances. */
export const isDummyActionsEnabled = clientEnv.NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS;

/* -------------------------------------------------------------------------- */
/* Origin resolution                                                          */
/* -------------------------------------------------------------------------- */

/** Prefix a bare host with a scheme so `new URL()` accepts it. */
export const normalizeOriginCandidate = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
};

/**
 * This app's own public origin, for absolute URLs generated on the server.
 *
 * Candidate order is deliberate: explicit configuration first, then the two
 * values Vercel injects, then a local fallback. `VERCEL_URL`, `HOST` and `PORT`
 * are server-only and read as `undefined` in the browser, which is why this
 * must not be relied on client-side.
 */
export const resolveAppOrigin = (): string => {
  const configured =
    normalizeOriginCandidate(clientEnv.NEXT_PUBLIC_APP_URL) ??
    normalizeOriginCandidate(clientEnv.NEXT_PUBLIC_SITE_URL) ??
    normalizeOriginCandidate(clientEnv.NEXT_PUBLIC_VERCEL_URL) ??
    normalizeOriginCandidate(process.env.VERCEL_URL);

  if (configured) return configured.replace(/\/$/, "");

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = (process.env.HOST ?? "localhost").replace(/\/$/, "");
  const portSegment = host.includes(":") ? "" : `:${process.env.PORT ?? "3000"}`;
  return `${protocol}://${host}${portSegment}`;
};

/* -------------------------------------------------------------------------- */
/* Server segment                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Backend API base URL for local development.
 *
 * Port 8001, not the backend's own default of 5000: on macOS, AirPlay Receiver
 * occupies 5000 and answers with 403 instead of refusing the connection, so the
 * clash presents as a broken API rather than a port conflict.
 *
 * This is the value `docs/tutorials/getting-started.md` and
 * `docs/how-to/development/run-against-a-local-backend.md` instruct you to start
 * the backend on, and both have been validated by running them verbatim. The
 * competing `:4000` that appeared in some reference prose is retired.
 */
export const DEV_API_BASE_URL = "http://localhost:8001/api/v1";

/**
 * Backend API base URL. Server-only.
 *
 * Throws when nothing is configured in production rather than interpolating
 * `undefined` into a request URL, which is how `undefined/auth/login` used to
 * reach the network.
 */
export const getApiBaseUrl = (): string => {
  const configured =
    normalizeOriginCandidate(process.env.API_URL) ??
    normalizeOriginCandidate(clientEnv.NEXT_PUBLIC_API_BASE_URL);

  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[env] API_URL is not set. The backend base URL has no safe default in " +
        "production. Set API_URL (and NEXT_PUBLIC_API_BASE_URL to the same value) " +
        "in the deployment environment. See docs/reference/configuration.md.",
    );
  }

  return DEV_API_BASE_URL;
};
