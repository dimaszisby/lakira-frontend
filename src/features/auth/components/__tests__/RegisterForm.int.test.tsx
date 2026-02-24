import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import RegisterForm from "@/features/auth/components/RegisterForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams("returnUrl=/metrics"),
}));

describe("RegisterForm integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("submits valid registration data, syncs session, and redirects to return URL", async () => {
    const user = userEvent.setup();
    const registerPayloadSpy = jest.fn();
    const sessionPayloadSpy = jest.fn();

    server.use(
      http.post("/api/proxy/auth/register", async ({ request }) => {
        const body = await request.json();
        registerPayloadSpy(body);

        return HttpResponse.json({
          status: "success",
          message: "Register success",
          data: {
            token: "token-123",
            user: {
              id: "user-1",
              username: "john",
              email: "john@example.com",
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

    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), "john");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/metrics");
    });

    expect(registerPayloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "john",
        email: "john@example.com",
        password: "password123",
        passwordConfirmation: "password123",
        isPublicProfile: true,
      }),
    );
    expect(sessionPayloadSpy).toHaveBeenCalledWith({ token: "token-123" });
  });

  it("shows mismatch validation and keeps submit disabled", async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/username/i), "john");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password321");

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeDisabled();
  });

  it("shows error feedback and does not redirect when register fails", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post("/api/proxy/auth/register", () =>
          HttpResponse.json(
            {
              status: "fail",
              message: "Email already exists",
              data: null,
            },
            { status: 409 },
          ),
        ),
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/username/i), "john");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
      await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("has no critical accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(<RegisterForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
