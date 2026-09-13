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
