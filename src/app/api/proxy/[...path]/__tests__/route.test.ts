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
const SWITCH_PATH = "auth/switch-org";
const SWITCH_SEGMENTS = ["auth", "switch-org"];
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

/** An unsigned JWT that expires in an hour, built at runtime so no token literal sits in this file. */
const usableToken = (claims: Record<string, unknown> = {}) => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64").replace(/=+$/, "");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${encode({ alg: "none" })}.${encode({ exp, ...claims })}.sig`;
};

/** A backend JSON response, as `/auth/login` and its siblings send. */
const upstreamJson = (status: number, body: unknown, setCookie: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json" });
  Object.defineProperty(headers, "getSetCookie", { value: () => setCookie });
  return {
    status,
    headers,
    body: null,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
};

const USER = { id: "user-1", email: "a@example.test" };

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
        upstreamJson(200, { status: "success", data: { token: usableToken(), user: USER } }, [
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
        upstreamJson(200, { status: "success", data: { token: usableToken(), user: USER } }, [
          `${REFRESH_COOKIE_NAME}=x; Path=/api/v1/auth/refresh`,
        ]),
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

describe("a response that issues an access token", () => {
  /**
   * The browser used to receive the token in the body, read it in JavaScript
   * and post it to `/api/auth/session` to be stored (audit 2026-10-04, N3). The
   * proxy now stores it itself and removes it from what the browser sees
   * (ADR-0025).
   */
  const SESSION = { [SESSION_COOKIE_NAME]: usableToken() };

  // AC-1 to AC-4, and AC-5 for the two that also return a user.
  it.each([
    ["auth/login", ["auth", "login"], 200, { user: USER }, {}],
    ["auth/register", ["auth", "register"], 201, { user: USER }, {}],
    [SWITCH_PATH, SWITCH_SEGMENTS, 200, {}, SESSION],
    ["auth/refresh", ["auth", "refresh"], 200, {}, {}],
  ])(
    "stores the token from %s as the session cookie and strips it from the body",
    async (path, segments, status, rest, cookies) => {
      const token = usableToken({ organizationId: "org-2" });
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          upstreamJson(status, { status: "success", data: { token, ...rest } }),
        ) as unknown as typeof fetch;

      const response = await POST(request(path, cookies, "POST"), context(...segments));

      expect(response.status).toBe(status);

      const cookie = setCookies(response)[SESSION_COOKIE_NAME];
      expect(cookie).toContain(`${SESSION_COOKIE_NAME}=${token}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("Path=/");

      const text = await response.text();
      expect(text).not.toContain(token);
      expect(JSON.parse(text)).toEqual({ status: "success", data: rest });
    },
  );

  // A switch made with an expired access token: the first call is a 401, the
  // proxy refreshes and retries, and the retry issues a token of its own. The
  // refresh obtained a token for the OLD organization; the one the backend just
  // issued is for the new one and has to be the cookie that survives, beside the
  // refresh cookie the switch issued.
  it("lets a newly issued session win over one a refresh obtained on the way", async () => {
    const refreshedOldOrg = usableToken({ organizationId: "org-old" });
    const issuedNewOrg = usableToken({ organizationId: "org-new" });
    mockRefresh.mockResolvedValue({ token: refreshedOldOrg, refreshToken: "rotated-old-org" });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(upstream(401))
      .mockResolvedValueOnce(
        upstreamJson(200, { status: "success", data: { token: issuedNewOrg } }, [
          `${REFRESH_COOKIE_NAME}=issued-new-org; Path=/api/v1/auth/refresh; HttpOnly`,
        ]),
      ) as unknown as typeof fetch;

    const response = await POST(
      request(
        SWITCH_PATH,
        { [SESSION_COOKIE_NAME]: "expired", [REFRESH_COOKIE_NAME]: "r" },
        "POST",
      ),
      context(...SWITCH_SEGMENTS),
    );

    expect(response.status).toBe(200);
    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain(`${SESSION_COOKIE_NAME}=${issuedNewOrg}`);
    expect(cookies[REFRESH_COOKIE_NAME]).toContain(`${REFRESH_COOKIE_NAME}=issued-new-org`);
    expect(response.headers.getSetCookie().join("\n")).not.toContain(refreshedOldOrg);
    expect(response.headers.getSetCookie().join("\n")).not.toContain("rotated-old-org");
  });

  it("ends the session, refreshed cookies included, when the retried call issues no usable token", async () => {
    mockRefresh.mockResolvedValue({ token: usableToken(), refreshToken: "rotated" });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(upstream(401))
      .mockResolvedValueOnce(
        upstreamJson(200, { status: "success", data: {} }),
      ) as unknown as typeof fetch;

    const response = await POST(
      request(
        SWITCH_PATH,
        { [SESSION_COOKIE_NAME]: "expired", [REFRESH_COOKIE_NAME]: "r" },
        "POST",
      ),
      context(...SWITCH_SEGMENTS),
    );

    expect(response.status).toBe(502);
    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).not.toContain("rotated");
  });

  // AC-6.
  it.each([
    ["no token at all", { user: USER }],
    ["a token that is not a JWT", { token: "not-a-jwt", user: USER }],
    ["an expired token", { token: usableToken({ exp: 1 }), user: USER }],
    ["a token that is not a string", { token: { nested: usableToken() } }],
    ["no data object", undefined],
  ])("answers 502 and ends the session when a success carries %s", async (_label, data) => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        upstreamJson(200, { status: "success", data }, [
          `${REFRESH_COOKIE_NAME}=new-org; Path=/api/v1/auth/refresh; HttpOnly`,
        ]),
      ) as unknown as typeof fetch;

    const response = await POST(request(SWITCH_PATH, SESSION, "POST"), context(...SWITCH_SEGMENTS));

    expect(response.status).toBe(502);

    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).not.toContain("new-org");

    const text = await response.text();
    expect(text).not.toContain("eyJ");
    expect(text).not.toContain("not-a-jwt");
  });

  it("answers 502 when the success body is not JSON", async () => {
    const broken = upstreamJson(200, null);
    (broken as unknown as { text: () => Promise<string> }).text = () => Promise.resolve("<html>");
    global.fetch = jest.fn().mockResolvedValue(broken) as unknown as typeof fetch;

    const response = await POST(request(LOGIN_PATH, {}, "POST"), context("auth", "login"));

    expect(response.status).toBe(502);
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
  });

  // AC-7.
  it("forwards an error on a token-issuing path untouched, and sets no session", async () => {
    const stream = new Response(JSON.stringify({ status: "fail", message: "Invalid" })).body;
    const failed = upstream(401);
    (failed as unknown as { body: unknown }).body = stream;
    global.fetch = jest.fn().mockResolvedValue(failed) as unknown as typeof fetch;

    const response = await POST(request(LOGIN_PATH, {}, "POST"), context("auth", "login"));

    expect(response.status).toBe(401);
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toBeUndefined();
    await expect(response.json()).resolves.toEqual({ status: "fail", message: "Invalid" });
  });

  it("leaves a token in the body of any other path alone", async () => {
    const stream = new Response(JSON.stringify({ data: { token: "api-key-for-something" } })).body;
    const other = upstream(200);
    (other as unknown as { body: unknown }).body = stream;
    global.fetch = jest.fn().mockResolvedValue(other) as unknown as typeof fetch;

    const response = await POST(request("metrics", SESSION, "POST"), context("metrics"));

    expect(setCookies(response)[SESSION_COOKIE_NAME]).toBeUndefined();
    await expect(response.json()).resolves.toEqual({ data: { token: "api-key-for-something" } });
  });

  it("does not treat a GET on a token-issuing path as issuing one", async () => {
    global.fetch = jest.fn().mockResolvedValue(upstream(200)) as unknown as typeof fetch;

    const response = await GET(request(LOGIN_PATH), context("auth", "login"));

    expect(response.status).toBe(200);
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toBeUndefined();
  });
});
