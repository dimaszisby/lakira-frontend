/**
 * @jest-environment node
 */

import { cookies, headers } from "next/headers";

import { getServerAuthHeaders } from "../serverHeaders";

jest.mock("next/headers", () => ({ cookies: jest.fn(), headers: jest.fn() }));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;

const REPORTED = "203.0.113.7";
const SESSION_COOKIE = "lakira_token=session";

const renderingRequest = (jar: Record<string, string>, requestHeaders: Record<string, string>) => {
  mockCookies.mockResolvedValue({
    getAll: () => Object.entries(jar).map(([name, value]) => ({ name, value })),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  mockHeaders.mockResolvedValue(
    new Headers(requestHeaders) as unknown as Awaited<ReturnType<typeof headers>>,
  );
};

describe("getServerAuthHeaders", () => {
  it("carries the session cookie and the address the reverse proxy reported (ADR-0050)", async () => {
    renderingRequest({ lakira_token: "session" }, { "x-forwarded-for": REPORTED });

    expect(await getServerAuthHeaders()).toEqual({
      Cookie: SESSION_COOKIE,
      "X-Forwarded-For": REPORTED,
    });
  });

  it("carries only the rightmost entry when a browser prepended its own", async () => {
    renderingRequest(
      { lakira_token: "session" },
      { "x-forwarded-for": `198.51.100.9, ${REPORTED}` },
    );

    expect((await getServerAuthHeaders())?.["X-Forwarded-For"]).toBe(REPORTED);
  });

  it("carries only the cookie when the request names no client", async () => {
    renderingRequest({ lakira_token: "session" }, {});

    expect(await getServerAuthHeaders()).toEqual({ Cookie: SESSION_COOKIE });
  });

  it("leaves the address out when the rightmost entry is not an IP address", async () => {
    renderingRequest({ lakira_token: "session" }, { "x-forwarded-for": "unknown" });

    expect(await getServerAuthHeaders()).toEqual({ Cookie: SESSION_COOKIE });
  });

  it("is undefined with neither a cookie nor an address", async () => {
    renderingRequest({}, {});

    expect(await getServerAuthHeaders()).toBeUndefined();
  });
});
