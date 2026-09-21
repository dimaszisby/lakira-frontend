import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import LoginForm from "@/features/auth/components/LoginForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const LOGIN_ENDPOINT = "/api/proxy/auth/login";
const TEST_EMAIL = "john@example.com";

describe("LoginForm integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("submits valid credentials, syncs session, and redirects to dashboard", async () => {
    const user = userEvent.setup();
    const loginPayloadSpy = jest.fn();
    const sessionPayloadSpy = jest.fn();
    const email = TEST_EMAIL;

    server.use(
      http.post(LOGIN_ENDPOINT, async ({ request }) => {
        const body = await request.json();
        loginPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Login success",
          data: {
            token: "token-123",
            user: {
              id: "user-1",
              username: "john",
              email,
              role: "user",
              isPublicProfile: true,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          },
        });
      }),
      http.post("/api/auth/session", async ({ request }) => {
        const body = await request.json();
        sessionPayloadSpy(body);
        return HttpResponse.json({ ok: true });
      }),
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    expect(loginPayloadSpy).toHaveBeenCalledWith({
      email,
      password: "password123",
    });
    expect(sessionPayloadSpy).toHaveBeenCalledWith({ token: "token-123" });
  });

  it("shows error feedback and does not redirect when login fails", async () => {
    const user = userEvent.setup();
    const email = TEST_EMAIL;
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post(LOGIN_ENDPOINT, () =>
          HttpResponse.json(
            {
              status: "fail",
              message: "Invalid credentials",
              data: null,
            },
            { status: 401 },
          ),
        ),
      );

      renderWithProviders(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), email);
      await user.type(screen.getByPlaceholderText(/enter your password/i), "wrong-password");
      await user.click(screen.getByRole("button", { name: /login/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  /**
   * These assert the *text*, not merely that an alert appeared. The bug they
   * cover passed a test that only checked for `role="alert"`: `auth.api.ts`
   * flattened the Axios error into a plain `Error`, the form normalized it a
   * second time, and every failure — wrong password, rate limit, 500 — rendered
   * as "We couldn't reach the server. Check your connection and try again."
   */
  describe("error messages reflect what actually happened", () => {
    const submit = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
      await user.type(screen.getByPlaceholderText(/enter your password/i), "some-password");
      await user.click(screen.getByRole("button", { name: /login/i }));
    };

    const CONNECTION_COPY = /couldn't reach the server/i;

    it("tells a rate-limited user to wait, not to check their connection", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        server.use(
          http.post(LOGIN_ENDPOINT, () =>
            HttpResponse.json(
              { status: 429, message: "Too many requests, please try again later." },
              { status: 429 },
            ),
          ),
        );

        renderWithProviders(<LoginForm />);
        await submit(user);

        // The backend's own wording, not ours. Our "Too many attempts" copy is
        // now a fallback for when the server says nothing, so a specific server
        // message wins — which is the point of the change. Either sentence
        // satisfies what this test is actually about: telling the user to wait.
        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/too many requests, please try again later/i);
        expect(alert).not.toHaveTextContent(CONNECTION_COPY);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    // AC-6. This test used to assert only that the copy was not the connection
    // message, with a comment explaining that the 401 mapping said "Your session
    // expired" — wrong for a login form — and that it was logged as a separate
    // finding. This is that finding closed, so the assertion is now exact.
    it("shows the reason the credential was rejected", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        server.use(
          http.post(LOGIN_ENDPOINT, () =>
            HttpResponse.json(
              { status: "fail", message: "Invalid email or password" },
              { status: 401 },
            ),
          ),
        );

        renderWithProviders(<LoginForm />);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/invalid email or password/i);
        expect(alert).not.toHaveTextContent(/session expired/i);
        expect(alert).not.toHaveTextContent(CONNECTION_COPY);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("says something went wrong on our side for a 500", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        server.use(http.post(LOGIN_ENDPOINT, () => new HttpResponse(null, { status: 500 })));

        renderWithProviders(<LoginForm />);
        await submit(user);

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent(/on our side/i);
        expect(alert).not.toHaveTextContent(CONNECTION_COPY);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("still blames the connection when the request genuinely does not land", async () => {
      // The one case the old copy was right about, kept honest.
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        server.use(http.post(LOGIN_ENDPOINT, () => HttpResponse.error()));

        renderWithProviders(<LoginForm />);
        await submit(user);

        expect(await screen.findByRole("alert")).toHaveTextContent(CONNECTION_COPY);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });

  it("has no critical accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
