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
const FETCH_FAILED = "fetch failed";

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

describe("a backend the proxy cannot reach", () => {
  // The backend reports its own 5xx faults. This is the one it cannot: no
  // response ever arrived. It used to escape as an unhandled rejection.
  it("answers 502 and logs at error, which is what gets forwarded", async () => {
    const stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    global.fetch = jest.fn().mockRejectedValue(new TypeError(FETCH_FAILED)) as typeof fetch;

    try {
      const response = await GET(
        request("metrics", { [SESSION_COOKIE_NAME]: "valid" }),
        context("metrics"),
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "The server could not be reached.",
      });
      const lines = stdout.mock.calls.map(([line]) => JSON.parse(String(line)) as object);
      expect(lines).toEqual([
        expect.objectContaining({
          level: "error",
          msg: "proxy.upstream_unreachable",
          path: "metrics",
          method: "GET",
        }),
      ]);
    } finally {
      stdout.mockRestore();
    }
  });
});

describe("a backend that goes away between the refresh and the retry", () => {
  /**
   * The refresh already rotated the token on the backend. Answering without the
   * new pair leaves the browser holding a redeemed refresh token; its next
   * refresh reads as replay and the backend revokes the whole session family.
   */
  it("still hands the rotated session to the browser on the 502", async () => {
    const stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    mockRefresh.mockResolvedValue({ token: "fresh", refreshToken: "rotated" });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(upstream(401))
      .mockRejectedValueOnce(new TypeError(FETCH_FAILED)) as unknown as typeof fetch;

    try {
      const response = await GET(
        request("metrics", { [SESSION_COOKIE_NAME]: "expired", [REFRESH_COOKIE_NAME]: "r" }),
        context("metrics"),
      );

      expect(response.status).toBe(502);
      const cookies = setCookies(response);
      expect(cookies[SESSION_COOKIE_NAME]).toContain(`${SESSION_COOKIE_NAME}=fresh`);
      expect(cookies[REFRESH_COOKIE_NAME]).toContain(`${REFRESH_COOKIE_NAME}=rotated`);
    } finally {
      stdout.mockRestore();
    }
  });

  it("sets no cookies when nothing was refreshed", async () => {
    const stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    global.fetch = jest.fn().mockRejectedValue(new TypeError(FETCH_FAILED)) as typeof fetch;

    try {
      const response = await GET(
        request("metrics", { [SESSION_COOKIE_NAME]: "valid" }),
        context("metrics"),
      );

      expect(setCookies(response)).toEqual({});
    } finally {
      stdout.mockRestore();
    }
  });
});

describe("a backend 5xx", () => {
  it("passes through, logged at warn with the backend's request id", async () => {
    const stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    const failed = upstream(500);
    failed.headers.set("x-request-id", "req-123");
    global.fetch = jest.fn().mockResolvedValue(failed) as typeof fetch;

    try {
      const response = await GET(
        request("metrics", { [SESSION_COOKIE_NAME]: "valid" }),
        context("metrics"),
      );

      expect(response.status).toBe(500);
      expect(response.headers.get("x-request-id")).toBe("req-123");
      const lines = stdout.mock.calls.map(([line]) => JSON.parse(String(line)) as object);
      expect(lines).toEqual([
        expect.objectContaining({
          level: "warn",
          msg: "proxy.upstream_error",
          status: 500,
          requestId: "req-123",
        }),
      ]);
    } finally {
      stdout.mockRestore();
    }
  });
});

describe("a path that tries to leave the API base", () => {
  /**
   * Next decodes each segment before the handler sees it, so `..%2f..%2fhealth`
   * arrives as the single segment `../../health`. Joined raw into a URL, that
   * climbed out of `/api/v1` to any path on the backend's origin, with the
   * caller's bearer token attached (audit 2026-10-04, N1).
   */
  const SESSION = { [SESSION_COOKIE_NAME]: "any-value" };

  it.each([
    ["an encoded slash inside one segment", ["../../health"]],
    ["a dot-dot segment of its own", ["..", "..", "health"]],
    ["a dot-dot after a public path", ["auth", "login", "..", "..", "..", "health"]],
    ["a backslash", ["..\\..\\health"]],
    ["a single dot", ["metrics", "."]],
    ["an empty segment", ["metrics", ""]],
  ])("is refused with 400 and never forwarded: %s", async (_label, segments) => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    const response = await GET(request("x", SESSION), context(...segments));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid path" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("is refused before the session check, so a caller with no cookie gets 400 too", async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    const response = await GET(request("x"), context("..", "health"));

    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["a literal percent-encoded dot-dot", ["%2e%2e", "health"], "/api/v1/%252e%252e/health"],
    ["a question mark", ["metrics?admin=1"], "/api/v1/metrics%3Fadmin%3D1"],
    ["a hash", ["metrics#frag", "abc"], "/api/v1/metrics%23frag/abc"],
  ])("keeps %s inside one path component", async (_label, segments, pathname) => {
    const fetchMock = jest.fn().mockResolvedValue(upstream(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    await GET(request("x", SESSION), context(...segments));

    const target = fetchMock.mock.calls[0][0] as URL;
    expect(target.origin).toBe("http://backend.test");
    expect(target.pathname).toBe(pathname);
    expect(target.search).toBe("");
  });

  it("forwards an ordinary path and its query exactly as before", async () => {
    const fetchMock = jest.fn().mockResolvedValue(upstream(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    await GET(
      request("metrics/8f14e45f-ceea-467f-a9d1-3f0b2c1d9e77?limit=10&sort=name", SESSION),
      context("metrics", "8f14e45f-ceea-467f-a9d1-3f0b2c1d9e77"),
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://backend.test/api/v1/metrics/8f14e45f-ceea-467f-a9d1-3f0b2c1d9e77?limit=10&sort=name",
    );
  });
});
