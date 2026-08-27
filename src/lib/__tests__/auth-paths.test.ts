import { readFileSync } from "node:fs";
import path from "node:path";

import {
  isProtectedAppPath,
  isPublicApiPath,
  PROTECTED_APP_MATCHERS,
  PROTECTED_APP_PATHS,
  PUBLIC_API_PATHS,
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

describe("middleware matcher stays in sync", () => {
  // Next.js requires config.matcher to be statically analysable, so it cannot
  // be derived from PROTECTED_APP_PATHS at runtime — a computed value fails the
  // build with "matcher needs to be a static string or array of static
  // strings". This test is what keeps the literal honest instead.
  //
  // The matcher is read as source text rather than imported: importing
  // middleware.ts pulls in next/server, which needs web globals the jsdom test
  // environment does not provide.
  const readMatcherFromSource = (): string[] => {
    const source = readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
    const block = /matcher:\s*\[([^\]]*)\]/.exec(source);
    if (!block) throw new Error("could not find config.matcher in middleware.ts");
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
