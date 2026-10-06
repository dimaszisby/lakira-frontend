/**
 * @jest-environment node
 *
 * `proxy.ts` imports `next/server`, which needs web globals the jsdom
 * environment does not provide.
 */

import { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/constants/app";

import { proxy } from "../proxy";

const b64 = (value: object) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (expOffsetSeconds: number) => {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ id: "u1", exp: now + expOffsetSeconds })}.sig`;
};

const DASHBOARD = "/dashboard";

const request = (pathname: string, token?: string) => {
  const req = new NextRequest(new URL(`http://localhost:3000${pathname}`));
  if (token !== undefined) req.cookies.set(SESSION_COOKIE_NAME, token);
  return req;
};

const CSP = "content-security-policy";

/** `NextResponse.next({ request: { headers } })` exposes each forwarded header under this prefix. */
const forwarded = (response: Response, name: string) =>
  response.headers.get(`x-middleware-request-${name}`);

const nonceIn = (policy: string | null) => /'nonce-([^']+)'/.exec(policy ?? "")?.[1];

describe("proxy (the Content Security Policy nonce)", () => {
  // ADR-0026. The policy used to be a static header that allowed inline script.
  it.each([["/login"], ["/"], ["/forgot-password"], ["/some/unknown/page"]])(
    "sends %s on with a nonce in the policy, on the response and on the forwarded request",
    (pathname) => {
      const response = proxy(request(pathname));

      const nonce = nonceIn(response.headers.get(CSP));
      expect(nonce).toBeTruthy();
      expect(response.headers.get(CSP)).toContain("'strict-dynamic'");
      expect(response.headers.get(CSP)).not.toContain("script-src 'self' 'unsafe-inline'");

      // Next reads the nonce from the *request's* policy to stamp its own scripts,
      // and the root layout reads `x-nonce` to hand it to next-themes.
      expect(forwarded(response, CSP)).toBe(response.headers.get(CSP));
      expect(forwarded(response, "x-nonce")).toBe(nonce);
    },
  );

  it("does the same for a protected page a usable session is let into", () => {
    const response = proxy(request(DASHBOARD, makeToken(900)));

    expect(response.headers.get("location")).toBeNull();
    expect(forwarded(response, "x-nonce")).toBe(nonceIn(response.headers.get(CSP)));
  });

  it("never issues the same nonce twice", () => {
    const nonces = Array.from({ length: 20 }, () =>
      nonceIn(proxy(request("/login")).headers.get(CSP)),
    );
    expect(new Set(nonces).size).toBe(20);
  });

  it("allows script by nonce only: no unsafe-inline in script-src", () => {
    const policy = proxy(request("/login")).headers.get(CSP) ?? "";
    const scriptSrc = policy.split(";").find((part) => part.trim().startsWith("script-src")) ?? "";

    expect(scriptSrc).toContain("'nonce-");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });
});

describe("proxy (the edge session gate)", () => {
  it("lets an unprotected path through untouched", () => {
    expect(proxy(request("/login")).headers.get("location")).toBeNull();
  });

  it("lets a usable session through", () => {
    const response = proxy(request(DASHBOARD, makeToken(900)));
    expect(response.headers.get("location")).toBeNull();
  });

  /**
   * An expired access token is not an ended session: the backend pairs a
   * 15-minute access token with a 30-day refresh token. Bouncing to `/login`
   * here is what ended every session a quarter of an hour after login, however
   * healthy its refresh token was. The refresh cookie is scoped to `/api` and
   * is therefore invisible to the middleware — which is exactly why the request
   * has to be sent somewhere under `/api` to be redeemed.
   */
  it("sends an expired session to be revived, not to the login form", () => {
    const response = proxy(request("/metrics", makeToken(-60)));
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.pathname).toBe("/api/auth/revive");
    expect(location.searchParams.get("returnUrl")).toBe("/metrics");
  });

  it("carries the query string into the return url", () => {
    const req = new NextRequest(new URL("http://localhost:3000/metrics?sort=name&page=2"));
    req.cookies.set(SESSION_COOKIE_NAME, makeToken(-60));

    const location = new URL(proxy(req).headers.get("location") ?? "");
    expect(location.searchParams.get("returnUrl")).toBe("/metrics?sort=name&page=2");
  });

  it("tries to revive a malformed token too — the backend decides, not the shape", () => {
    const location = new URL(proxy(request("/account", "not-a-jwt")).headers.get("location") ?? "");
    expect(location.pathname).toBe("/api/auth/revive");
  });

  it("goes straight to the login form when there is no cookie to revive", () => {
    const location = new URL(proxy(request(DASHBOARD)).headers.get("location") ?? "");

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("returnUrl")).toBe(DASHBOARD);
  });

  it("does not clear the cookie on the way out", () => {
    // Clearing here would destroy a session the revive route could still
    // rescue: the middleware cannot see the refresh cookie, so it cannot know
    // whether one exists.
    const response = proxy(request(DASHBOARD, makeToken(-60)));
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });
});
