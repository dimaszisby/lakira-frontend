import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildUpstreamUrl,
  isProtectedAppPath,
  isPublicApiPath,
  isTokenIssuingApiPath,
  PROTECTED_APP_MATCHERS,
  PROTECTED_APP_PATHS,
  PUBLIC_API_PATHS,
  TOKEN_ISSUING_API_PATHS,
} from "../auth-paths";

describe("isProtectedAppPath", () => {
  it.each(["/dashboard", "/metrics", "/metric-categories", "/account"])(
    "protects %s exactly",
    (path) => {
      expect(isProtectedAppPath(path)).toBe(true);
    },
  );

  it.each([
    "/dashboard/overview",
    "/metrics/abc-123",
    "/metrics/abc-123/logs",
    "/metric-categories/new",
    "/account/settings",
  ])("protects the nested path %s", (path) => {
    expect(isProtectedAppPath(path)).toBe(true);
  });

  it.each(["/", "/login", "/register"])("leaves the public path %s open", (path) => {
    expect(isProtectedAppPath(path)).toBe(false);
  });

  it("does not protect a path that merely starts with the same characters", () => {
    // A prefix match on "/account" would wrongly gate "/accounts-payable".
    expect(isProtectedAppPath("/accounts-payable")).toBe(false);
    expect(isProtectedAppPath("/metrics-archive")).toBe(false);
  });
});

describe("proxy matcher stays in sync", () => {
  // Next.js requires config.matcher to be statically analysable, so it cannot
  // be derived from PROTECTED_APP_PATHS at runtime — a computed value fails the
  // build with "matcher needs to be a static string or array of static
  // strings". This test is what keeps the literal honest instead.
  //
  // The matcher is read as source text rather than imported: importing
  // src/proxy.ts pulls in next/server, which needs web globals the jsdom test
  // environment does not provide.
  //
  // The path matters as much as the contents. Next 16 renamed the `middleware`
  // convention to `proxy` and wants the file beside `app` — `src/` here. This
  // file was at the repository root under the old name, so the gate never ran
  // at all; `readFileSync` throwing is what would catch a move back.
  const readMatcherFromSource = (): string[] => {
    const source = readFileSync(path.join(process.cwd(), "src", "proxy.ts"), "utf8");
    const block = /matcher:\s*\[([^\]]*)\]/.exec(source);
    if (!block) throw new Error("could not find config.matcher in src/proxy.ts");
    return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  };

  it("matches PROTECTED_APP_MATCHERS exactly", () => {
    expect(readMatcherFromSource().sort()).toEqual([...PROTECTED_APP_MATCHERS].sort());
  });

  it("derives one matcher per protected path", () => {
    expect(PROTECTED_APP_MATCHERS).toHaveLength(PROTECTED_APP_PATHS.length);
  });
});

describe("isPublicApiPath", () => {
  const AUTH_PREFIX_NOTE = "secured despite the auth prefix";

  it.each([
    ["auth", "login"],
    ["auth", "register"],
    ["auth", "logout"],
    ["auth", "refresh"],
    ["auth", "forgot-password"],
    ["auth", "reset-password"],
    ["auth", "verify-email"],
  ])("allows %s/%s without a token", (...segments) => {
    expect(isPublicApiPath(segments)).toBe(true);
  });

  // Regression cover for the finding this inversion closes: these proxied
  // unauthenticated under the old protected-segment allowlist, and the OpenAPI
  // contract marks every one of them as secured.
  it.each([
    [["analytics", "dashboard"], "analytics was exposed by the old allowlist"],
    [["analytics", "metrics", "m-1"], "nested analytics likewise"],
    [["admin", "_ping"], "admin was exposed by the old allowlist"],
    [["organizations", "org-1", "members"], "the whole multi-tenancy surface"],
    [["memberships", "m-1"], "likewise"],
    [["invites", "accept"], "likewise"],
    [["metrics"], "already protected before, still protected"],
    [["auth", "profile"], AUTH_PREFIX_NOTE],
    [["auth", "switch-org"], AUTH_PREFIX_NOTE],
    [["auth", "resend-verification"], AUTH_PREFIX_NOTE],
  ])("requires a token for %s — %s", (segments) => {
    expect(isPublicApiPath(segments)).toBe(false);
  });

  it("matches whole paths, not prefixes", () => {
    // A prefix match on "auth" would expose auth/profile and auth/switch-org.
    expect(isPublicApiPath(["auth"])).toBe(false);
    expect(isPublicApiPath(["auth", "login", "extra"])).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isPublicApiPath(["Auth", "Login"])).toBe(true);
  });

  it("treats an empty path as protected", () => {
    expect(isPublicApiPath([])).toBe(false);
  });

  it("lists only auth entry points as public", () => {
    // Every public path must be under auth/. If this fails, something outside
    // the authentication entry points was made reachable without a session.
    for (const path of PUBLIC_API_PATHS) {
      expect(path.startsWith("auth/")).toBe(true);
    }
  });
});

describe("buildUpstreamUrl", () => {
  const ORIGIN = "http://backend.test";
  const BASE = `${ORIGIN}/api/v1`;

  it.each([
    [["metrics"], "http://backend.test/api/v1/metrics"],
    [["auth", "login"], "http://backend.test/api/v1/auth/login"],
    [["metric-settings", "42", "achieve"], "http://backend.test/api/v1/metric-settings/42/achieve"],
    [["admin", "_ping"], "http://backend.test/api/v1/admin/_ping"],
    // A dot inside a name is an ordinary character; only a whole-segment dot is special.
    [["files", "report.v2.csv"], "http://backend.test/api/v1/files/report.v2.csv"],
    [["...", "x"], "http://backend.test/api/v1/.../x"],
  ])("builds %j under the base", (segments, expected) => {
    expect(String(buildUpstreamUrl(BASE, segments))).toBe(expected);
  });

  it.each([
    [["../../health"]],
    [[".."]],
    [["metrics", "..", "..", "health"]],
    [["."]],
    [["metrics", ""]],
    [["a/b"]],
    [["..\\..\\health"]],
    [["a\\b"]],
  ])("refuses %j", (segments) => {
    expect(buildUpstreamUrl(BASE, segments)).toBeNull();
  });

  it.each([
    [["%2e%2e", "health"], "/api/v1/%252e%252e/health"],
    [["%2E%2E%2Fhealth"], "/api/v1/%252E%252E%252Fhealth"],
    [["metrics?admin=1"], "/api/v1/metrics%3Fadmin%3D1"],
    [["metrics#frag"], "/api/v1/metrics%23frag"],
    [["a b"], "/api/v1/a%20b"],
    [["@evil.test"], "/api/v1/%40evil.test"],
  ])("keeps %j as one opaque component", (segments, pathname) => {
    const url = buildUpstreamUrl(BASE, segments);
    expect(url?.origin).toBe(ORIGIN);
    expect(url?.pathname).toBe(pathname);
    expect(url?.search).toBe("");
    expect(url?.hash).toBe("");
  });

  it("refuses a segment that cannot be encoded instead of throwing", () => {
    // A lone surrogate, built at runtime so no unpaired code unit sits in this file.
    const loneSurrogate = String.fromCharCode(0xd800);
    expect(buildUpstreamUrl(BASE, ["metrics", loneSurrogate])).toBeNull();
  });

  it.each([
    ["a two-dot leader", String.fromCodePoint(0x2025), "/api/v1/%E2%80%A5/health"],
    [
      "fullwidth full stops",
      String.fromCodePoint(0xff0e, 0xff0e),
      "/api/v1/%EF%BC%8E%EF%BC%8E/health",
    ],
    ["a tab", String.fromCharCode(9), "/api/v1/%09/health"],
  ])("does not let %s act as a dot segment", (_label, segment, pathname) => {
    expect(buildUpstreamUrl(BASE, [segment, "health"])?.pathname).toBe(pathname);
  });

  it.each([
    ["a port", `${ORIGIN}:8001/api/v1`, `${ORIGIN}:8001/api/v1/metrics`],
    ["a query", `${BASE}?debug=1`, `${BASE}/metrics`],
    ["a fragment", `${BASE}#top`, `${BASE}/metrics`],
  ])("builds under a base that has %s", (_label, base, expected) => {
    expect(String(buildUpstreamUrl(base, ["metrics"]))).toBe(expected);
  });

  it("gives the same result whether or not the base ends in a slash", () => {
    expect(String(buildUpstreamUrl(`${BASE}/`, ["metrics"]))).toBe(`${BASE}/metrics`);
  });

  it("works when the API is served from the origin root", () => {
    expect(String(buildUpstreamUrl(ORIGIN, ["metrics"]))).toBe(`${ORIGIN}/metrics`);
    expect(buildUpstreamUrl(ORIGIN, ["..", "x"])).toBeNull();
  });

  it("builds the base itself for an empty path", () => {
    expect(String(buildUpstreamUrl(BASE, []))).toBe(`${BASE}/`);
  });
});

describe("isTokenIssuingApiPath", () => {
  it.each([
    [["auth", "login"]],
    [["auth", "register"]],
    [["auth", "switch-org"]],
    [["auth", "refresh"]],
  ])("is true for %j", (segments) => {
    expect(isTokenIssuingApiPath(segments)).toBe(true);
  });

  it.each([
    [["auth", "profile"]],
    [["auth", "logout"]],
    [["auth"]],
    [["auth", "login", "extra"]],
    [["metrics"]],
    [[]],
  ])("is false for %j", (segments) => {
    expect(isTokenIssuingApiPath(segments)).toBe(false);
  });

  it("is case-insensitive, like the public-path match", () => {
    expect(isTokenIssuingApiPath(["Auth", "Login"])).toBe(true);
  });
});

describe("TOKEN_ISSUING_API_PATHS stays complete", () => {
  // The proxy strips the access token from these responses and stores it as the
  // httpOnly session cookie (ADR-0025). An operation that returns a token and is
  // not listed would hand that token to browser JavaScript, and nothing else
  // would notice. So the list is checked against the contract itself.
  type Schema = {
    $ref?: string;
    properties?: Record<string, Schema>;
    allOf?: Schema[];
    oneOf?: Schema[];
    anyOf?: Schema[];
    items?: Schema;
  };
  type Operation = {
    responses?: Record<string, { content?: Record<string, { schema?: Schema }> }>;
  };
  type Contract = { paths: Record<string, Record<string, Operation>> };

  const contract = JSON.parse(
    readFileSync(
      path.join(process.cwd(), "docs", "reference", "api", "lakira-backend-openapi.json"),
      "utf8",
    ),
  ) as Contract;

  const resolve = (schema: Schema): Schema => {
    let current = schema;
    while (current.$ref) {
      current = current.$ref
        .split("/")
        .slice(1)
        .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], contract) as Schema;
    }
    return current;
  };

  const hasTokenProperty = (schema: Schema | undefined, depth = 0): boolean => {
    if (!schema || depth > 8) return false;
    const resolved = resolve(schema);
    if (resolved.properties) {
      if ("token" in resolved.properties) return true;
      if (Object.values(resolved.properties).some((child) => hasTokenProperty(child, depth + 1))) {
        return true;
      }
    }
    const branches = [
      ...(resolved.allOf ?? []),
      ...(resolved.oneOf ?? []),
      ...(resolved.anyOf ?? []),
    ];
    if (resolved.items) branches.push(resolved.items);
    return branches.some((child) => hasTokenProperty(child, depth + 1));
  };

  /** `METHOD path` for every operation whose success body declares a `token`. */
  const tokenReturningOperations = (): string[] => {
    const found: string[] = [];
    for (const [apiPath, operations] of Object.entries(contract.paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        const successes = Object.entries(operation.responses ?? {}).filter(([status]) =>
          status.startsWith("2"),
        );
        const returnsToken = successes.some(([, response]) =>
          Object.values(response.content ?? {}).some((media) => hasTokenProperty(media.schema)),
        );
        if (returnsToken) found.push(`${method.toUpperCase()} ${apiPath}`);
      }
    }
    return found.sort();
  };

  it("finds the token-returning operations in the contract", () => {
    // If this is ever empty the walk has stopped seeing the contract, and the
    // comparison below would pass for the wrong reason.
    expect(tokenReturningOperations().length).toBeGreaterThan(0);
  });

  it("lists every operation whose success response carries a token", () => {
    const listed = [...TOKEN_ISSUING_API_PATHS].map((apiPath) => `POST /${apiPath}`).sort();
    expect(tokenReturningOperations()).toEqual(listed);
  });
});
