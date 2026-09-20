/**
 * @jest-environment node
 */

import { cookies } from "next/headers";

import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/constants/app";

import { POST } from "../route";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/env", () => ({ getApiBaseUrl: () => "http://backend.test/api/v1" }));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

const withCookies = (jar: Record<string, string>) => {
  mockCookies.mockResolvedValue({
    get: (name: string) => (jar[name] === undefined ? undefined : { name, value: jar[name] }),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
};

const setCookies = (response: Response) =>
  Object.fromEntries(
    response.headers.getSetCookie().map((cookie) => [cookie.split("=")[0], cookie]),
  );

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  it("clears both cookies", async () => {
    // The bug this replaces: logout posted through the proxy, which strips
    // Set-Cookie, so nothing on this origin changed and `/login` redirected
    // back to the dashboard on the cookie that was never removed.
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;
    withCookies({ [SESSION_COOKIE_NAME]: "access", [REFRESH_COOKIE_NAME]: "refresh" });

    const response = await POST();

    const cleared = setCookies(response);
    expect(cleared[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cleared[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
  });

  it("hands the backend the refresh cookie, which is what identifies the family to revoke", async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = spy as unknown as typeof fetch;
    withCookies({ [SESSION_COOKIE_NAME]: "access", [REFRESH_COOKIE_NAME]: "refresh" });

    await POST();

    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://backend.test/api/v1/auth/logout");
    expect(init.method).toBe("POST");

    const headers = new Headers(init.headers);
    expect(headers.get("cookie")).toBe(`${REFRESH_COOKIE_NAME}=refresh`);
    expect(headers.get("authorization")).toBe("Bearer access");
  });

  it("still clears the session when the backend is unreachable", async () => {
    // A user who asks to be logged out is logged out. Refusing to clear would
    // leave the session fully usable, which is worse than a refresh token that
    // lives until it expires.
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    withCookies({ [SESSION_COOKIE_NAME]: "access", [REFRESH_COOKIE_NAME]: "refresh" });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
  });

  it("still clears the session when the backend rejects the call", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401 }) as unknown as typeof fetch;
    withCookies({ [SESSION_COOKIE_NAME]: "stale" });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(setCookies(response)[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
  });

  it("works with no cookies at all", async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = spy as unknown as typeof fetch;
    withCookies({});

    const response = await POST();

    expect(response.status).toBe(200);
    const headers = new Headers((spy.mock.calls[0] as [string, RequestInit])[1].headers);
    expect(headers.get("cookie")).toBeNull();
    expect(headers.get("authorization")).toBeNull();
  });
});
