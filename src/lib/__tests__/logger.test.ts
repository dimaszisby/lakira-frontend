/**
 * @jest-environment node
 *
 * The logger deliberately no-ops in the browser: a browser console is not a log
 * drain, and the fields describe server state. The default unit environment is
 * jsdom, where `window` is defined, so these must run under node.
 */

import type { LogEntry } from "../logger";
import type * as LoggerNamespace from "../logger";
import {
  logger,
  MAX_STRING_LENGTH,
  redact,
  REDACTED,
  SENSITIVE_KEY_PATTERN,
  setLogSink,
} from "../logger";

const AUTH_HEADER = "Bearer abc.def.ghi";

describe("SENSITIVE_KEY_PATTERN", () => {
  // The backend's equivalent is anchored with `$`, so it matches only keys that
  // *end* in a sensitive word. These are the keys that anchoring lets through.
  it.each([
    "authorization",
    "Authorization",
    "cookie",
    "set-cookie",
    "bearer",
    "dsn",
    "SENTRY_DSN",
    "authorizationHeader",
    "cookieJar",
    "sessionId",
    "apiKey",
    "api_key",
    "privateKey",
    "x-access-token",
    "refreshToken",
    "userPassword",
    "credentials",
    "signature",
  ])("matches %s", (key) => {
    expect(SENSITIVE_KEY_PATTERN.test(key)).toBe(true);
  });

  it.each(["userId", "email", "path", "status", "durationMs", "metricName", "count"])(
    "does not match the benign key %s",
    (key) => {
      expect(SENSITIVE_KEY_PATTERN.test(key)).toBe(false);
    },
  );
});

describe("redact", () => {
  it("replaces sensitive values while preserving benign siblings", () => {
    expect(redact({ userId: "u1", authorization: AUTH_HEADER })).toEqual({
      userId: "u1",
      authorization: REDACTED,
    });
  });

  it("redacts nested fields", () => {
    expect(redact({ req: { headers: { cookie: "a=b" }, path: "/metrics" } })).toEqual({
      req: { headers: { cookie: REDACTED }, path: "/metrics" },
    });
  });

  it("redacts inside arrays", () => {
    expect(redact([{ token: "t" }, { userId: "u" }])).toEqual([
      { token: REDACTED },
      { userId: "u" },
    ]);
  });

  it("serialises an Error, which JSON.stringify would otherwise flatten to {}", () => {
    const result = redact(new Error("boom")) as Record<string, unknown>;
    expect(result.name).toBe("Error");
    expect(result.message).toBe("boom");
    expect(typeof result.stack).toBe("string");
    expect(JSON.stringify(new Error("boom"))).toBe("{}");
  });

  it("passes primitives through untouched", () => {
    expect(redact("plain")).toBe("plain");
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
  });

  it("stops at max depth instead of recursing without bound", () => {
    let deep: Record<string, unknown> = { value: "leaf" };
    for (let i = 0; i < 10; i += 1) deep = { nested: deep };
    expect(JSON.stringify(redact(deep))).toContain("[max depth]");
  });
});

describe("logger", () => {
  let entries: LogEntry[];

  beforeEach(() => {
    entries = [];
    setLogSink((entry) => entries.push(entry));
  });

  afterEach(() => setLogSink(null));

  it("emits level, message, and an ISO timestamp", () => {
    logger.info("proxy request", { path: "/metrics" });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: "info", msg: "proxy request", path: "/metrics" });
    expect(new Date(entries[0].time).toISOString()).toBe(entries[0].time);
  });

  it("redacts fields on the way out", () => {
    logger.error("upstream rejected", { authorization: AUTH_HEADER, status: 401 });
    expect(entries[0].authorization).toBe(REDACTED);
    expect(entries[0].status).toBe(401);
  });

  it.each(["debug", "info", "warn", "error"] as const)("supports level %s", (level) => {
    setLogSink((entry) => entries.push(entry));
    logger[level]("message");
    expect(entries.at(-1)?.level).toBe(level);
  });

  it("works with no fields supplied", () => {
    logger.warn("bare");
    expect(entries[0]).toMatchObject({ level: "warn", msg: "bare" });
  });
});

describe("scrubbing on the way to stdout", () => {
  // Stdout is what a log drain ships, so it is asserted on directly rather than
  // through a sink. Until 2026-10-06 only the copy sent to Sentry was scrubbed.
  const ADDRESS = "ada@example.com";
  // Built from parts so the secret scan does not read it as a credential.
  const JWT = ["eyJhbGciOi", "eyJzdWIiOiIx", "c2lnbmF0dXJl"].join(".");

  let stdout: jest.SpyInstance;

  const line = (): string => String(stdout.mock.calls.at(-1)?.[0]);
  const entry = (): Record<string, unknown> => JSON.parse(line()) as Record<string, unknown>;

  beforeEach(() => {
    setLogSink(null);
    stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdout.mockRestore();
  });

  it.each(["info", "warn", "error"] as const)(
    "removes an address, a bearer value, a JWT and a query from a %s line",
    (level) => {
      logger[level]("event", {
        message: `No account for ${ADDRESS}`,
        detail: `sent ${AUTH_HEADER} then ${JWT}`,
        referrer: "https://app.example/invites/accept?token=abc123&org=7",
        nested: { list: [`again ${ADDRESS}`] },
      });

      expect(entry()).toMatchObject({
        level,
        message: "No account for [email]",
        detail: `sent Bearer ${REDACTED} then ${REDACTED}`,
        referrer: "https://app.example/invites/accept",
        nested: { list: ["again [email]"] },
      });
      expect(line()).not.toContain(ADDRESS);
      expect(line()).not.toContain(JWT);
      expect(line()).not.toContain("abc123");
    },
  );

  it("scrubs the message and the stack of an Error passed as a field", () => {
    const error = new Error(`Lookup failed for ${ADDRESS}`);
    error.stack = `Error: Lookup failed for ${ADDRESS}\n    at load (/app/page.js?token=abc123:10:20)`;

    logger.error("server.request_error", { error });

    expect(entry().error).toEqual({
      name: "Error",
      message: "Lookup failed for [email]",
      stack: "Error: Lookup failed for [email]\n    at load (/app/page.js:10:20)",
    });
  });

  it.each(["path", "url"])("drops the query and the fragment from a %s field", (key) => {
    logger.info("event", { [key]: "/reset-password?expired#access=abc123" });

    expect(entry()[key]).toBe("/reset-password");
  });

  it("cuts a string at the length cap before it is scrubbed", () => {
    // The patterns run on every string, so the cap is what bounds their cost.
    const long = "a".repeat(MAX_STRING_LENGTH + 500);

    logger.warn("event", { detail: long, path: long, error: new Error(long) });

    const capped = `${"a".repeat(MAX_STRING_LENGTH)}...`;
    expect(entry()).toMatchObject({ detail: capped, path: capped, error: { message: capped } });
    expect((entry().error as { stack: string }).stack).toHaveLength(MAX_STRING_LENGTH + 3);
  });

  it("leaves identifiers, numbers and plain text as they were", () => {
    logger.info("proxy.refreshed", { path: "/metrics", requestId: "req-123", status: 200 });

    expect(entry()).toMatchObject({ path: "/metrics", requestId: "req-123", status: 200 });
  });
});

describe("setLogSink across module instances", () => {
  /**
   * Next bundles the logger into each server chunk that imports it, so the copy
   * `src/instrumentation.ts` registers the sink on is not the copy a route
   * handler logs through. Two isolated loads of the module stand in for two
   * chunks.
   */
  afterEach(() => setLogSink(null));

  it("delivers an entry logged by one copy to the sink registered on another", () => {
    let registering!: typeof LoggerNamespace;
    let logging!: typeof LoggerNamespace;
    jest.isolateModules(() => {
      registering = jest.requireActual<typeof LoggerNamespace>("../logger");
    });
    jest.isolateModules(() => {
      logging = jest.requireActual<typeof LoggerNamespace>("../logger");
    });
    expect(logging).not.toBe(registering);

    const entries: LogEntry[] = [];
    registering.setLogSink((entry) => entries.push(entry));
    logging.logger.error("client.error", { message: "boom" });

    expect(entries).toEqual([
      expect.objectContaining({ level: "error", msg: "client.error", message: "boom" }),
    ]);
  });
});
