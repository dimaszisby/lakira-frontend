/**
 * @jest-environment node
 *
 * Route handlers run on the server; `next/server` and the logger both expect a
 * Node environment.
 */

import { NextRequest } from "next/server";

import { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/constants/app";
import { refreshAccessToken } from "@/lib/auth-refresh";

import { GET } from "../route";

jest.mock("@/lib/auth-refresh", () => ({
  ...jest.requireActual("@/lib/auth-refresh"),
  refreshAccessToken: jest.fn(),
}));

const mockRefresh = refreshAccessToken as jest.MockedFunction<typeof refreshAccessToken>;

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

const request = (returnUrl?: string, refreshToken = "refresh-value") => {
  const url = new URL("http://localhost:3000/api/auth/revive");
  if (returnUrl !== undefined) url.searchParams.set("returnUrl", returnUrl);

  const req = new NextRequest(url);
  if (refreshToken) req.cookies.set(REFRESH_COOKIE_NAME, refreshToken);
  return req;
};

/** `Set-Cookie` entries by name, so expiry can be told apart from a value. */
const setCookies = (response: Response) =>
  Object.fromEntries(
    response.headers.getSetCookie().map((cookie) => [cookie.split("=")[0], cookie]),
  );

beforeEach(() => {
  mockRefresh.mockReset();
});

describe("GET /api/auth/revive", () => {
  it("revives the session and continues to where the user was going", async () => {
    const token = makeToken(900);
    mockRefresh.mockResolvedValue({ token, refreshToken: "rotated" });

    const response = await GET(request("/metrics/abc?tab=logs"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/metrics/abc?tab=logs");

    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain(`${SESSION_COOKIE_NAME}=${token}`);
    expect(cookies[REFRESH_COOKIE_NAME]).toContain(`${REFRESH_COOKIE_NAME}=rotated`);
    // Scoped to this origin's /api, not the backend's refresh path.
    expect(cookies[REFRESH_COOKIE_NAME]).toContain("Path=/api");
  });

  it("redeems the refresh cookie the request carried", async () => {
    mockRefresh.mockResolvedValue({ token: makeToken(900), refreshToken: null });
    await GET(request(DASHBOARD, "the-cookie"));
    expect(mockRefresh).toHaveBeenCalledWith("the-cookie");
  });

  it("falls back to the dashboard when there is nowhere to return to", async () => {
    mockRefresh.mockResolvedValue({ token: makeToken(900), refreshToken: null });
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("sends a rejected session to the login form and clears both cookies", async () => {
    mockRefresh.mockResolvedValue(null);

    const response = await GET(request("/metrics"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?returnUrl=%2Fmetrics",
    );

    // Both, because a surviving refresh cookie can mint a new access token.
    const cookies = setCookies(response);
    expect(cookies[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
    expect(cookies[REFRESH_COOKIE_NAME]).toContain("Max-Age=0");
  });

  it("clears the session when no refresh cookie was sent at all", async () => {
    mockRefresh.mockResolvedValue(null);

    const response = await GET(request(DASHBOARD, ""));

    expect(mockRefresh).toHaveBeenCalledWith(undefined);
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
  });

  /**
   * The middleware sends any unusable token here, so handing back a token that
   * is itself unusable would bounce straight back — and each hop would rotate
   * the family again. Treating it as a failed revival is what terminates the
   * redirect: every exit is a usable session or `/login`, which is not gated.
   */
  it("does not hand back a token that is already expired", async () => {
    mockRefresh.mockResolvedValue({ token: makeToken(-60), refreshToken: "rotated" });

    const response = await GET(request(DASHBOARD));

    expect(response.headers.get("location")).toContain("/login");
    expect(setCookies(response)[SESSION_COOKIE_NAME]).toContain("Max-Age=0");
  });

  it("refuses to redirect off-origin", async () => {
    mockRefresh.mockResolvedValue({ token: makeToken(900), refreshToken: null });
    const response = await GET(request("//evil.test/phish"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("refuses an off-origin return even when the revival fails", async () => {
    mockRefresh.mockResolvedValue(null);
    const response = await GET(request("https://evil.test/phish"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("is never cached", async () => {
    mockRefresh.mockResolvedValue({ token: makeToken(900), refreshToken: null });
    const response = await GET(request(DASHBOARD));
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
