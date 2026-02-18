import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("LoginForm integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("submits valid credentials, syncs session, and redirects to dashboard", async () => {
    const user = userEvent.setup();
    const loginPayloadSpy = jest.fn();
    const sessionPayloadSpy = jest.fn();
    const email = "john@example.com";

    server.use(
      http.post("/api/proxy/auth/login", async ({ request }) => {
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
    const email = "john@example.com";
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post("/api/proxy/auth/login", () =>
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
});
