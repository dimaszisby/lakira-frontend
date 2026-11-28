/**
 * @jest-environment node
 *
 * No `window`, as on the server, which is the branch of `resolveBaseUrl` under test.
 */

import type * as ApiModuleNamespace from "../api";

const ORIGINAL_ENV = process.env;
const PUBLIC_HOST = "app.example.test";
const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}`;

type ApiModule = typeof ApiModuleNamespace;

/** `baseURL` is computed when the module loads, so each case re-imports it. */
const loadApi = (overrides: Record<string, string | undefined>): ApiModule => {
  process.env = { ...ORIGINAL_ENV, ...overrides } as NodeJS.ProcessEnv;
  let mod!: ApiModule;
  jest.isolateModules(() => {
    mod = require("../api") as ApiModule;
  });
  return mod;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

/**
 * A server-side call reaches the proxy on loopback, never through the public origin
 * (ADR-0050). Sent out through the reverse proxy, it would arrive with that proxy's
 * address, and every signed-in user would share one rate-limit budget; nothing else
 * would notice (#222). Every public-origin candidate is set, so a client that went back
 * to `resolveAppOrigin()` would show here as that origin, not as a default that matches.
 */
describe("the API client on the server", () => {
  it("sends its calls to the proxy on loopback, whatever the public origin", () => {
    const { default: api } = loadApi({
      PORT: "4321",
      NEXT_PUBLIC_APP_URL: PUBLIC_ORIGIN,
      NEXT_PUBLIC_SITE_URL: PUBLIC_ORIGIN,
      NEXT_PUBLIC_VERCEL_URL: PUBLIC_HOST,
      VERCEL_URL: PUBLIC_HOST,
      HOST: PUBLIC_HOST,
    });

    expect(api.defaults.baseURL).toBe("http://127.0.0.1:4321/api/proxy");
  });

  it("uses port 3000 when none is set", () => {
    const { default: api } = loadApi({ PORT: undefined, NEXT_PUBLIC_APP_URL: PUBLIC_ORIGIN });

    expect(api.defaults.baseURL).toBe("http://127.0.0.1:3000/api/proxy");
  });
});
