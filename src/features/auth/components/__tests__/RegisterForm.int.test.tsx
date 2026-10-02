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
const FIXTURE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

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
              createdAt: FIXTURE_TIMESTAMP,
              updatedAt: FIXTURE_TIMESTAMP,
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

  it.each([
    ["the session cookie cannot be stored", { token: "token-123" }, 400],
    ["the response carries no token", {}, 200],
  ])(
    "shows an error and does not redirect when registration succeeds but %s",
    async (_label, tokenField, sessionStatus) => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      try {
        server.use(
          http.post(REGISTER_ENDPOINT, () =>
            HttpResponse.json(
              {
                status: "success",
                data: {
                  ...tokenField,
                  user: {
                    id: "user-1",
                    username: "john",
                    email: TEST_EMAIL,
                    role: "user",
                    isPublicProfile: true,
                    createdAt: FIXTURE_TIMESTAMP,
                    updatedAt: FIXTURE_TIMESTAMP,
                  },
                },
              },
              { status: 201 },
            ),
          ),
          http.post("/api/auth/session", () =>
            HttpResponse.json({ error: "Invalid token" }, { status: sessionStatus }),
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
    },
  );

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
   *
   * The body is the one backend #127 sends for its per-IP registration limit.
   * That limit is counted per hour, so a retried 429 would spend the user's
   * remaining attempts: the request must go out exactly once.
   */
  it("reports a rate limit as a rate limit, not a connection failure", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    let registerRequests = 0;

    try {
      server.use(
        http.post(REGISTER_ENDPOINT, () => {
          registerRequests += 1;
          return HttpResponse.json(
            { status: 429, message: "Too many registration attempts, please try again later." },
            { status: 429 },
          );
        }),
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/username/i), "john");
      await user.type(screen.getByLabelText(/email/i), TEST_EMAIL);
      await user.type(screen.getByPlaceholderText(/enter your password/i), "password123");
      await user.type(screen.getByPlaceholderText(/confirm your password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      // The backend's wording, not ours: a specific server message now wins over
      // the status copy, which is a fallback for when the server says nothing.
      // The wait outlasts axios-retry's backoff, so a regression that retries
      // fails on the request count below rather than on a missing alert.
      const alert = await screen.findByRole("alert", {}, { timeout: 4000 });
      expect(alert).toHaveTextContent(/too many registration attempts, please try again later/i);
      expect(alert).not.toHaveTextContent(/couldn't reach the server/i);
      expect(registerRequests).toBe(1);
    } finally {
      consoleErrorSpy.mockRestore();
    }
    // Above the alert wait, so a missing alert fails on findByRole's message, not a timeout.
  }, 8000);

  it("has no critical accessibility violations on initial render", async () => {
    const { container } = renderWithProviders(<RegisterForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
