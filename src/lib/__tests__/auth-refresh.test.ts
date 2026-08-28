/**
 * @jest-environment node
 *
 * The module imports the logger, which no-ops in a browser environment.
 */

import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, SESSION_COOKIE_NAME } from "@/constants/app";

import { applyRefreshedSession, captureRefreshCookie, refreshAccessToken } from "../auth-refresh";

const b64 = (value: object) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (expOffsetSeconds = 900) => {
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ id: "u1", iat: now, exp: now + expOffsetSeconds })}.sig`;
};

/** Minimal Headers stand-in carrying Set-Cookie entries. */
const headersWithSetCookie = (cookies: string[]): Headers => {
  const headers = new Headers();
  // getSetCookie is what the implementation reads; jsdom/node Headers support it.
  Object.defineProperty(headers, "getSetCookie", { value: () => cookies });
  return headers;
};

const okResponse = (token: string, setCookie: string[] = []) =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ status: "success", data: { token } }),
    headers: headersWithSetCookie(setCookie),
  }) as unknown as Response;

describe("captureRefreshCookie", () => {
  it("extracts the refresh token from a Set-Cookie list", () => {
    const headers = headersWithSetCookie([
      `${REFRESH_COOKIE_NAME}=abc123; Path=/api/v1/auth/refresh; HttpOnly; SameSite=Strict`,
    ]);
    expect(captureRefreshCookie(headers)).toBe("abc123");
  });

  it("ignores unrelated cookies", () => {
    expect(captureRefreshCookie(headersWithSetCookie(["other=x; Path=/"]))).toBeNull();
  });

  it("returns null when nothing was set", () => {
    expect(captureRefreshCookie(headersWithSetCookie([]))).toBeNull();
  });

  it("does not match a cookie whose name merely ends with the target", () => {
    expect(captureRefreshCookie(headersWithSetCookie([`not_${REFRESH_COOKIE_NAME}=x`]))).toBeNull();
  });
});

describe("refreshAccessToken", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns null without a refresh token, and makes no request", async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    expect(await refreshAccessToken(undefined)).toBeNull();
    expect(await refreshAccessToken(null)).toBeNull();
    expect(await refreshAccessToken("")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns the new token and the rotated refresh cookie", async () => {
    const token = makeToken();
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        okResponse(token, [`${REFRESH_COOKIE_NAME}=rotated; Path=/api/v1/auth/refresh`]),
      ) as unknown as typeof fetch;

    expect(await refreshAccessToken("old")).toEqual({ token, refreshToken: "rotated" });
  });

  it("sends the refresh token as a cookie header", async () => {
    const spy = jest.fn().mockResolvedValue(okResponse(makeToken()));
    global.fetch = spy as unknown as typeof fetch;
    await refreshAccessToken("tok");
    expect(spy.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: { cookie: `${REFRESH_COOKIE_NAME}=tok` },
    });
  });

  it("returns null when the backend rejects the refresh token", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ status: "fail" }),
      headers: headersWithSetCookie([]),
    }) as unknown as typeof fetch;
    expect(await refreshAccessToken("revoked")).toBeNull();
  });

  it("returns null when the backend is unreachable", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    expect(await refreshAccessToken("tok")).toBeNull();
  });

  it("returns null when the response carries no usable token", async () => {
    for (const data of [{}, { token: 42 }, { token: "not-a-jwt" }]) {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: "success", data }),
        headers: headersWithSetCookie([]),
      }) as unknown as typeof fetch;
      expect(await refreshAccessToken("tok")).toBeNull();
    }
  });

  it("reads the token from the response envelope, not the top level", async () => {
    // The backend wraps everything in {status, message, data}. Reading the top
    // level is the bug this flow already hit once in the login route.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "success", token: makeToken() }),
      headers: headersWithSetCookie([]),
    }) as unknown as typeof fetch;
    expect(await refreshAccessToken("tok")).toBeNull();
  });
});

describe("applyRefreshedSession", () => {
  const makeWriter = () => {
    const calls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    return {
      calls,
      set: (name: string, value: string, options: Record<string, unknown>) => {
        calls.push({ name, value, options });
      },
    };
  };

  it("writes the new access token", () => {
    const writer = makeWriter();
    applyRefreshedSession(writer, { token: "new-token", refreshToken: null });
    const session = writer.calls.find((c) => c.name === SESSION_COOKIE_NAME);
    expect(session?.value).toBe("new-token");
    expect(session?.options).toMatchObject({ httpOnly: true, secure: true, path: "/" });
  });

  it("writes the rotated refresh cookie scoped to this origin, not the backend's path", () => {
    const writer = makeWriter();
    applyRefreshedSession(writer, { token: "t", refreshToken: "r" });
    const refresh = writer.calls.find((c) => c.name === REFRESH_COOKIE_NAME);
    // Scoped to /api because the proxy at /api/proxy is what redeems it; a
    // cookie scoped to /api/auth is never sent there.
    expect(refresh?.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: REFRESH_COOKIE_PATH,
    });
    expect(REFRESH_COOKIE_PATH).toBe("/api");
  });

  it("leaves the existing refresh cookie alone when none was rotated", () => {
    const writer = makeWriter();
    applyRefreshedSession(writer, { token: "t", refreshToken: null });
    expect(writer.calls.some((c) => c.name === REFRESH_COOKIE_NAME)).toBe(false);
  });
});
