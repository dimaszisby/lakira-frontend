/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/constants/app";
import { refreshAccessToken } from "@/lib/auth-refresh";

import { GET, POST } from "../route";

jest.mock("@/lib/env", () => ({ getApiBaseUrl: () => "http://backend.test/api/v1" }));
jest.mock("@/lib/auth-refresh", () => ({
  ...jest.requireActual("@/lib/auth-refresh"),
  refreshAccessToken: jest.fn(),
}));

const mockRefresh = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;

const LOGIN_PATH = "auth/login";

const context = (...segments: string[]) => ({ params: Promise.resolve({ path: segments }) });

const request = (path: string, cookies: Record<string, string> = {}, method = "GET") => {
  const req = new NextRequest(new URL(`http://localhost:3000/api/proxy/${path}`), { method });
  Object.entries(cookies).forEach(([name, value]) => req.cookies.set(name, value));
  return req;
};

/** A backend response, with a `getSetCookie` the implementation can read. */
const upstream = (status: number, setCookie: string[] = []) => {
  const headers = new Headers();
  Object.defineProperty(headers, "getSetCookie", { value: () => setCookie });
  return { status, body: null, headers } as unknown as Response;
};

const setCookies = (response: Response) =>
  Object.fromEntries(
    response.headers.getSetCookie().map((cookie) => [cookie.split("=")[0], cookie]),
  );

const originalFetch = global.fetch;

beforeEach(() => {
  mockRefresh.mockReset();
  mockRefresh.mockResolvedValue(null);
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("the refresh cookie the backend issues on login", () => {
  /**
   * Login runs `POST /api/proxy/auth/login` from the browser, so the proxy is
   * the only place the backend's refresh cookie passes through. It used to be
   * deleted with the rest of the Set-Cookie header, which is why no session
   * ever outlived its 15-minute access token: the refresh cookie never existed
   * on this origin, so the proxy's own 401 retry had nothing to redeem.
   */
  it("is re-issued against this origin rather than dropped", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        upstream(200, [
          `${REFRESH_COOKIE_NAME}=from-backend; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict`,
        ]),
      ) as unknown as typeof fetch;

    const response = await POST(request(LOGIN_PATH, {}, "POST"), context("auth", "login"));

    const cookie = setCookies(response)[REFRESH_COOKIE_NAME];
    expect(cookie).toContain(`${REFRESH_COOKIE_NAME}=from-backend`);
    // Re-scoped: the backend's own path does not exist on this origin, so a
    // verbatim cookie would never be sent back.
    expect(cookie).toContain("Path=/api");
    expect(cookie).toContain("HttpOnly");
  });

  it("does not leak the backend's own Set-Cookie header through", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        upstream(200, [`${REFRESH_COOKIE_NAME}=x; Path=/api/v1/auth/refresh`]),
      ) as unknown as typeof fetch;

    const response = await POST(request(LOGIN_PATH, {}, "POST"), context("auth", "login"));

    expect(response.headers.getSetCookie().every((c) => !c.includes("/api/v1/auth/refresh"))).toBe(
      true,
    );
  });

  it("is left alone when the backend issues none", async () => {
    global.fetch = jest.fn().mockResolvedValue(upstream(200)) as unknown as typeof fetch;

    const response = await GET(
      request("metrics", { [SESSION_COOKIE_NAME]: "t" }),
      context("metrics"),
    );

    expect(setCookies(response)[REFRESH_COOKIE_NAME]).toBeUndefined();
  });
});

describe("a 401 refresh cannot rescue", () => {
  /**
   * The trap this closes: a token the backend rejects used to survive every
   * request, so the app 401'd forever while `/login` redirected back to the
   * dashboard on the strength of the cookie still being there.
   */
  it("clears both cookies", async () => {
    global.fetch = jest.fn().mockResolvedValue(upstream(401)) as unknown as typeof fetch;

    const response = await GET(
      request("metrics", { [SESSION_COOKIE_NAME]: "rejected" }),
      context("metrics"),
    );

    const cleared = setCookies(response);
    expect(cleared[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cleared[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
    expect(response.status).toBe(401);
  });

  // AC-5. The backend's wording here is "Unauthorized: Invalid token", which is
  // both jargon and indistinguishable from a wrong password once it reaches the
  // UI. Having just ended the session, the proxy is the only thing that knows.
  it("answers with its own SESSION_EXPIRED body instead of the backend's", async () => {
    global.fetch = jest.fn().mockResolvedValue(upstream(401)) as unknown as typeof fetch;

    const response = await GET(
      request("metrics", { [SESSION_COOKIE_NAME]: "rejected" }),
      context("metrics"),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Session expired",
      code: "SESSION_EXPIRED",
    });
  });

  it("leaves the session alone when refresh rescued it", async () => {
    mockRefresh.mockResolvedValue({ token: "fresh", refreshToken: "rotated" });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(upstream(401))
      .mockResolvedValueOnce(upstream(200)) as unknown as typeof fetch;

    const response = await GET(
      request("metrics", { [SESSION_COOKIE_NAME]: "expired", [REFRESH_COOKIE_NAME]: "r" }),
      context("metrics"),
    );

    expect(response.status).toBe(200);
    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain(`${SESSION_COOKIE_NAME}=fresh`);
    expect(cookies[SESSION_COOKIE_NAME]).not.toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).toContain(`${REFRESH_COOKIE_NAME}=rotated`);
  });

  it("does not clear anything on a public path", async () => {
    // A wrong password on `/auth/login` is a 401 about the credentials in the
    // request, not about the session — and the caller may not have one at all.
    global.fetch = jest.fn().mockResolvedValue(upstream(401)) as unknown as typeof fetch;

    const response = await POST(request(LOGIN_PATH, {}, "POST"), context("auth", "login"));

    expect(response.headers.getSetCookie()).toHaveLength(0);
  });

  it("redeems the refresh cookie the request carried", async () => {
    global.fetch = jest.fn().mockResolvedValue(upstream(401)) as unknown as typeof fetch;

    await GET(
      request("metrics", { [SESSION_COOKIE_NAME]: "t", [REFRESH_COOKIE_NAME]: "the-cookie" }),
      context("metrics"),
    );

    expect(mockRefresh).toHaveBeenCalledWith("the-cookie");
  });
});

describe("a protected path reached with no session cookie", () => {
  // AC-5, the other half. This 401 never reaches the backend at all, so the
  // only body the UI can see is the one the proxy writes here.
  it("is denied with a tagged SESSION_EXPIRED body and never forwarded", async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    const response = await GET(request("metrics"), context("metrics"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Session expired",
      code: "SESSION_EXPIRED",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
