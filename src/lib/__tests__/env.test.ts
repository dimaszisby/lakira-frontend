/**
 * Coverage for the environment helpers extracted in Phase 3.
 *
 * `resolveAppOrigin` previously lived unexported and untested inside
 * `src/services/api/api.ts`. These tests pin its candidate order before that
 * logic moved, so the extraction is verifiable rather than assumed.
 *
 * The module reads `process.env` at import time, so each test re-imports it
 * under `jest.isolateModules` with a mutated environment.
 */

import type * as EnvModuleNamespace from "../env";

const ORIGINAL_ENV = process.env;

/** Hoisted so the repeated fixtures stay single-sourced. */
const EXAMPLE_ORIGIN = "https://example.com";
const LOCALHOST_ORIGIN = "http://localhost:3000";
const APP_ORIGIN = "https://app.example.com";
const SITE_ORIGIN = "https://site.example.com";
const API_URL_FIXTURE = "https://api.example.com/api/v1";
const PUBLIC_API_URL_FIXTURE = "https://public.example.com/api/v1";

type EnvModule = typeof EnvModuleNamespace;

const loadEnv = (overrides: Record<string, string | undefined>): EnvModule => {
  process.env = { ...ORIGINAL_ENV, ...overrides } as NodeJS.ProcessEnv;
  let mod!: EnvModule;
  jest.isolateModules(() => {
    mod = require("../env") as EnvModule;
  });
  return mod;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("normalizeOriginCandidate", () => {
  const { normalizeOriginCandidate } = loadEnv({});

  it("returns null for empty, blank, and missing values", () => {
    expect(normalizeOriginCandidate(undefined)).toBeNull();
    expect(normalizeOriginCandidate(null)).toBeNull();
    expect(normalizeOriginCandidate("")).toBeNull();
    expect(normalizeOriginCandidate("   ")).toBeNull();
  });

  it("preserves an explicit scheme", () => {
    expect(normalizeOriginCandidate(LOCALHOST_ORIGIN)).toBe(LOCALHOST_ORIGIN);
    expect(normalizeOriginCandidate(EXAMPLE_ORIGIN)).toBe(EXAMPLE_ORIGIN);
  });

  it("assumes https for a bare host, which is how Vercel injects VERCEL_URL", () => {
    expect(normalizeOriginCandidate("my-app.vercel.app")).toBe("https://my-app.vercel.app");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeOriginCandidate(`  ${EXAMPLE_ORIGIN}  `)).toBe(EXAMPLE_ORIGIN);
  });
});

describe("resolveAppOrigin candidate order", () => {
  it("prefers NEXT_PUBLIC_APP_URL above every other candidate", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: APP_ORIGIN,
      NEXT_PUBLIC_SITE_URL: SITE_ORIGIN,
      NEXT_PUBLIC_VERCEL_URL: "vercel.example.com",
      VERCEL_URL: "raw.example.com",
    });
    expect(resolveAppOrigin()).toBe(APP_ORIGIN);
  });

  it("falls back to NEXT_PUBLIC_SITE_URL", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: SITE_ORIGIN,
      NEXT_PUBLIC_VERCEL_URL: "vercel.example.com",
    });
    expect(resolveAppOrigin()).toBe(SITE_ORIGIN);
  });

  it("falls back to NEXT_PUBLIC_VERCEL_URL, adding the scheme", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_VERCEL_URL: "preview.vercel.app",
      VERCEL_URL: "raw.example.com",
    });
    expect(resolveAppOrigin()).toBe("https://preview.vercel.app");
  });

  it("falls back to the server-injected VERCEL_URL", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_VERCEL_URL: undefined,
      VERCEL_URL: "raw.vercel.app",
    });
    expect(resolveAppOrigin()).toBe("https://raw.vercel.app");
  });

  it("falls back to HOST and PORT when nothing is configured", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_VERCEL_URL: undefined,
      VERCEL_URL: undefined,
      HOST: "127.0.0.1",
      PORT: "4321",
      NODE_ENV: "development",
    });
    expect(resolveAppOrigin()).toBe("http://127.0.0.1:4321");
  });

  it("defaults to localhost:3000 with no HOST or PORT", () => {
    const { resolveAppOrigin } = loadEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_VERCEL_URL: undefined,
      VERCEL_URL: undefined,
      HOST: undefined,
      PORT: undefined,
      NODE_ENV: "development",
    });
    expect(resolveAppOrigin()).toBe(LOCALHOST_ORIGIN);
  });

  it("strips a trailing slash so callers can concatenate a path", () => {
    const { resolveAppOrigin } = loadEnv({ NEXT_PUBLIC_APP_URL: `${EXAMPLE_ORIGIN}/` });
    expect(resolveAppOrigin()).toBe(EXAMPLE_ORIGIN);
  });
});

describe("getApiBaseUrl", () => {
  it("prefers the server-only API_URL", () => {
    const { getApiBaseUrl } = loadEnv({
      API_URL: API_URL_FIXTURE,
      NEXT_PUBLIC_API_BASE_URL: PUBLIC_API_URL_FIXTURE,
    });
    expect(getApiBaseUrl()).toBe(API_URL_FIXTURE);
  });

  it("falls back to NEXT_PUBLIC_API_BASE_URL", () => {
    const { getApiBaseUrl } = loadEnv({
      API_URL: undefined,
      NEXT_PUBLIC_API_BASE_URL: PUBLIC_API_URL_FIXTURE,
    });
    expect(getApiBaseUrl()).toBe(PUBLIC_API_URL_FIXTURE);
  });

  it("uses the documented port 8001 dev default, not the retired 4000", () => {
    const { getApiBaseUrl, DEV_API_BASE_URL } = loadEnv({
      API_URL: undefined,
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NODE_ENV: "development",
    });
    expect(getApiBaseUrl()).toBe(DEV_API_BASE_URL);
    expect(getApiBaseUrl()).toContain(":8001");
    expect(getApiBaseUrl()).not.toContain(":4000");
  });

  it("throws in production rather than interpolating undefined into a URL", () => {
    const { getApiBaseUrl } = loadEnv({
      API_URL: undefined,
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NODE_ENV: "production",
    });
    expect(() => getApiBaseUrl()).toThrow(/API_URL is not set/);
  });

  it("strips a trailing slash so callers can append a path", () => {
    const { getApiBaseUrl } = loadEnv({ API_URL: `${API_URL_FIXTURE}/` });
    expect(getApiBaseUrl()).toBe(API_URL_FIXTURE);
  });
});

describe("isDummyActionsEnabled", () => {
  it('is true only for the exact string "true"', () => {
    expect(loadEnv({ NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: "true" }).isDummyActionsEnabled).toBe(true);
    expect(loadEnv({ NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: "false" }).isDummyActionsEnabled).toBe(
      false,
    );
    expect(loadEnv({ NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: "1" }).isDummyActionsEnabled).toBe(false);
    expect(loadEnv({ NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS: undefined }).isDummyActionsEnabled).toBe(
      false,
    );
  });
});
