/**
 * @jest-environment node
 *
 * The logger deliberately no-ops in the browser: a browser console is not a log
 * drain, and the fields describe server state. The default unit environment is
 * jsdom, where `window` is defined, so these must run under node.
 */

import type {LogEntry} from "../logger";
import {
  logger,
  redact,
  REDACTED,
  SENSITIVE_KEY_PATTERN,
  setLogSink
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
