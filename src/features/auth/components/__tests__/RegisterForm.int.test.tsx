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

const REGISTER_ENDPOINT = "/api/proxy/auth/register";
const TEST_EMAIL = "john@example.com";

describe("RegisterForm integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("submits valid registration data, syncs session, and redirects to return URL", async () => {
    const user = userEvent.setup();
    const registerPayloadSpy = jest.fn();
    const sessionPayloadSpy = jest.fn();

    server.use(
      http.post(REGISTER_ENDPOINT, async ({ request }) => {
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
              email: TEST_EMAIL,
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
    await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
    await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
    await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/metrics");
    });

    expect(registerPayloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "john",
        email: TEST_EMAIL,
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
    await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
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
        http.post(REGISTER_ENDPOINT, () =>
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
      await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
      await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
      await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  /**
   * Same defect as LoginForm: `auth.api.ts` flattened the Axios error, the form
   * normalized the plain `Error` a second time, and every failure rendered as a
   * connection problem. Asserted on the text, since the existing failure test
   * only checks that an alert exists.
   */
  it("reports a rate limit as a rate limit, not a connection failure", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      server.use(
        http.post(REGISTER_ENDPOINT, () =>
          HttpResponse.json(
            { status: 429, message: "Too many requests, please try again later." },
            { status: 429 },
          ),
        ),
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/username/i), "john");
      await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
      await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
      await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      // The backend's wording, not ours: a specific server message now wins over
      // the status copy, which is a fallback for when the server says nothing.
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(/too many requests, please try again later/i);
      expect(alert).not.toHaveTextContent(/couldn't reach the server/i);
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
