/**
 * A signed-in session for the Lighthouse gate (ADR-0046).
 *
 * The signed-in routes redirect to /login without a session, so `run-lighthouse.mjs` measures them
 * as a user this module registers for the run, with data it seeds, all through the app's own
 * `/api/proxy`. Each Lighthouse run then gets a fresh sign-in, passed as the session cookie with
 * `--extra-headers`, so the 15-minute access token cannot expire mid-route.
 *
 * It creates an account, so it refuses any app URL that is not a local host, as the stack specs'
 * helpers do (`cypress/support/stack.ts`).
 */

// The literal from src/constants/app.ts, which a Node script cannot import.
const SESSION_COOKIE_NAME = "lakira_token";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const DAY_MS = 24 * 60 * 60 * 1000;

// Three metrics with two weeks of daily logs: three dashboard cards with charts, and three rows in
// the metrics list. A fixed set, so scores compare from night to night.
const METRICS = [
  { name: "Steps", defaultUnit: "steps", base: 8000, step: 450 },
  { name: "Sleep", defaultUnit: "hours", base: 7, step: 0.25 },
  { name: "Water", defaultUnit: "glasses", base: 6, step: 1 },
] as const;
const DAYS_OF_LOGS = 14;

export type PerfConfig = {
  lighthouse: { routes: string[]; signedInRoutes?: string[] };
};

export type PerfUser = { email: string; password: string };

/** The routes this run measures: public ones always, signed-in ones unless skipped. */
export const routesToMeasure = (config: PerfConfig, publicOnly: boolean) => ({
  publicRoutes: config.lighthouse.routes,
  signedInRoutes: publicOnly ? [] : (config.lighthouse.signedInRoutes ?? []),
  skippedRoutes: publicOnly ? (config.lighthouse.signedInRoutes ?? []) : [],
});

/** Throws unless `url` is on a local host. */
export const assertLocalUrl = (url: string): void => {
  const host = URL.canParse(url) ? new URL(url).hostname : "";
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      `Refusing to sign in at "${url}": it is not a local host. The signed-in routes register ` +
        "an account, so they run only against a local app and backend. Set PERF_PUBLIC_ONLY=1 " +
        "to measure the public routes alone.",
    );
  }
};

/** `lakira_token=<value>` from a response's `Set-Cookie` headers. */
export const sessionCookieFrom = (setCookies: readonly string[]): string => {
  const prefix = `${SESSION_COOKIE_NAME}=`;
  const pair = setCookies
    .map((header) => header.split(";", 1)[0].trim())
    .find((cookie) => cookie.startsWith(prefix) && cookie.length > prefix.length);
  if (!pair) {
    throw new Error(`Sign-in set no ${SESSION_COOKIE_NAME} cookie.`);
  }
  return pair;
};

/** The Lighthouse argument that sends `cookie` with every request of the run. */
export const extraHeadersArg = (cookie: string): string =>
  `--extra-headers=${JSON.stringify({ Cookie: cookie })}`;

const post = async (
  baseUrl: string,
  path: string,
  body: unknown,
  cookie?: string,
): Promise<Response> => {
  const response = await fetch(new URL(`/api/proxy${path}`, baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${path} answered ${response.status}.`);
  }
  return response;
};

const createdId = async (response: Response): Promise<string> => {
  const { data } = (await response.json()) as { data: { id: string } };
  return data.id;
};

/** Signs in through the proxy, as the app does, and returns the session cookie. */
export const signIn = async (baseUrl: string, user: PerfUser): Promise<string> => {
  assertLocalUrl(baseUrl);
  const response = await post(baseUrl, "/auth/login", user);
  return sessionCookieFrom(response.headers.getSetCookie());
};

/** Registers a fresh user and seeds its data. Returns the user, to sign in before each run. */
export const createPerfUser = async (baseUrl: string): Promise<PerfUser> => {
  assertLocalUrl(baseUrl);
  const stamp = Date.now();
  const user = { email: `perf-${stamp}@example.com`, password: "perf-run-password" };

  await post(baseUrl, "/auth/register", {
    ...user,
    username: `perf${stamp}`,
    passwordConfirmation: user.password,
    isPublicProfile: false,
  });
  const cookie = await signIn(baseUrl, user);

  // A plain-text icon: what is measured is the page, not the glyph.
  const categoryId = await createdId(
    await post(
      baseUrl,
      "/metric-categories",
      { name: "Health", color: "#D9D9D9", icon: "H" },
      cookie,
    ),
  );

  const now = Date.now();
  for (const metric of METRICS) {
    const metricId = await createdId(
      await post(
        baseUrl,
        "/metrics",
        { name: metric.name, defaultUnit: metric.defaultUnit, categoryId, isPublic: false },
        cookie,
      ),
    );
    for (let day = 0; day < DAYS_OF_LOGS; day++) {
      await post(
        baseUrl,
        "/metric-logs",
        {
          metricId,
          type: "manual",
          logValue: metric.base + (day % 5) * metric.step,
          loggedAt: new Date(now - day * DAY_MS).toISOString(),
        },
        cookie,
      );
    }
  }

  return user;
};
