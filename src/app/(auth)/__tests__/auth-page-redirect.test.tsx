/**
 * @jest-environment node
 *
 * Both pages are async server components; nothing here renders.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/constants/app";

import LoginPage from "../login/page";
import RegisterPage from "../register/page";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    // The real `redirect` throws to unwind the render, and the pages return
    // JSX below the call. Throwing here keeps the control flow honest.
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@/features/auth/components/LoginForm", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/features/auth/components/RegisterForm", () => ({
  __esModule: true,
  default: () => null,
}));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockRedirect = redirect as unknown as jest.Mock;

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

const withToken = (token?: string) => {
  mockCookies.mockResolvedValue({
    get: (name: string) =>
      name === SESSION_COOKIE_NAME && token !== undefined ? { name, value: token } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
};

const pages = [
  { name: "login", render: LoginPage },
  { name: "register", render: RegisterPage },
] as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each(pages)("/$name", ({ render }) => {
  const open = async (searchParams: { returnUrl?: string } = {}) =>
    render({ searchParams: Promise.resolve(searchParams) }).catch((error: Error) => {
      if (error.message !== "NEXT_REDIRECT") throw error;
      return null;
    });

  it("redirects a usable session away from the form", async () => {
    withToken(makeToken(900));
    await open();
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("honours the return url", async () => {
    withToken(makeToken(900));
    await open({ returnUrl: "/metrics/abc" });
    expect(mockRedirect).toHaveBeenCalledWith("/metrics/abc");
  });

  /**
   * The trap: a cookie holding a token the backend rejects. Testing presence
   * alone meant "log in again" bounced straight back to the dashboard, where
   * every call 401'd — and logout could not clear the cookie either, so there
   * was no way out of it from inside the app.
   */
  it("shows the form when the token has expired", async () => {
    withToken(makeToken(-60));
    await open();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("shows the form when the token is malformed", async () => {
    withToken("not-a-jwt");
    await open();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("shows the form when there is no cookie", async () => {
    withToken(undefined);
    await open();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
