/**
 * @jest-environment node
 */

import { setLogSink } from "@/lib/logger";

const init = jest.fn();
const captureException = jest.fn();
const captureMessage = jest.fn();

jest.mock("@sentry/node", () => ({
  init: (...args: unknown[]): unknown => init(...args),
  captureException: (...args: unknown[]): unknown => captureException(...args),
  captureMessage: (...args: unknown[]): unknown => captureMessage(...args),
  linkedErrorsIntegration: () => ({ name: "LinkedErrors" }),
  dedupeIntegration: () => ({ name: "Dedupe" }),
}));

const FAKE_DSN = "https://public@sentry.invalid/1";

const loadInstrumentation = async () => import("../instrumentation");

const stdoutLines = (spy: jest.SpyInstance): Record<string, unknown>[] =>
  spy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

describe("instrumentation", () => {
  const originalEnv = { ...process.env };
  let stdout: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    process.env.NEXT_RUNTIME = "nodejs";
    delete process.env.SENTRY_DSN;
    delete process.env.APP_RELEASE;
  });

  afterEach(() => {
    stdout.mockRestore();
    setLogSink(null);
    process.env = { ...originalEnv };
  });

  describe("register", () => {
    it("does nothing when SENTRY_DSN is unset", async () => {
      const { register } = await loadInstrumentation();

      await register();

      expect(init).not.toHaveBeenCalled();
      expect(stdout).not.toHaveBeenCalled();
    });

    it("does nothing outside the Node runtime, even with a DSN", async () => {
      process.env.NEXT_RUNTIME = "edge";
      process.env.SENTRY_DSN = FAKE_DSN;
      const { register } = await loadInstrumentation();

      await register();

      expect(init).not.toHaveBeenCalled();
    });

    it("initialises for errors only, with every data category off and the scrubber on", async () => {
      process.env.SENTRY_DSN = FAKE_DSN;
      process.env.APP_RELEASE = "abc1234";
      const { register } = await loadInstrumentation();

      await register();

      expect(init).toHaveBeenCalledTimes(1);
      const [options] = init.mock.calls[0] as [Record<string, unknown>];
      expect(options).toMatchObject({
        dsn: FAKE_DSN,
        release: "abc1234",
        tracesSampleRate: 0,
        attachStacktrace: false,
        defaultIntegrations: false,
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
          stackFrameVariables: false,
        },
      });
      expect(typeof options.beforeSend).toBe("function");
    });

    it("forwards a later logger.error and still writes it to stdout", async () => {
      process.env.SENTRY_DSN = FAKE_DSN;
      const { register } = await loadInstrumentation();
      const { logger } = await import("@/lib/logger");

      await register();
      stdout.mockClear();
      logger.error("proxy.upstream_unreachable", { path: "/metrics" });

      expect(captureMessage).toHaveBeenCalledTimes(1);
      expect(stdoutLines(stdout)).toEqual([
        expect.objectContaining({ level: "error", msg: "proxy.upstream_unreachable" }),
      ]);
    });

    it("fails soft when the SDK throws on init", async () => {
      process.env.SENTRY_DSN = FAKE_DSN;
      init.mockImplementationOnce(() => {
        throw new Error("bad dsn");
      });
      const { register } = await loadInstrumentation();

      await expect(register()).resolves.toBeUndefined();

      expect(stdoutLines(stdout)).toEqual([
        expect.objectContaining({ level: "warn", msg: "monitoring.init_failed" }),
      ]);
    });
  });

  describe("onRequestError", () => {
    it("logs the digest and route, without headers or the query string", async () => {
      const { onRequestError } = await loadInstrumentation();
      const error = Object.assign(new Error("render failed"), { digest: "digest-1" });

      await onRequestError(
        error,
        {
          path: "/reset-password?token=abc",
          method: "GET",
          headers: { cookie: "session=abc" },
        },
        {
          routerKind: "App Router",
          routePath: "/(auth)/reset-password",
          routeType: "render",
          renderSource: "react-server-components",
          revalidateReason: undefined,
        },
      );

      const [line] = stdoutLines(stdout);
      expect(line).toMatchObject({
        level: "error",
        msg: "server.request_error",
        digest: "digest-1",
        method: "GET",
        path: "/reset-password",
        routePath: "/(auth)/reset-password",
        routeType: "render",
      });
      expect(JSON.stringify(line)).not.toContain("token=abc");
      expect(JSON.stringify(line)).not.toContain("session=abc");
    });
  });
});
