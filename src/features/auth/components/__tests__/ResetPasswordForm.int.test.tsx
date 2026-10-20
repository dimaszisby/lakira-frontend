import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The second half of account recovery. The only browser check of it is a stack spec, which CI
// does not run (register row F-41).

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const RESET_ENDPOINT = "/api/proxy/auth/reset-password";
const TOKEN = "reset-token-from-the-email";
const PASSWORD = "a-new-password-1";
const UPDATE = { name: "Update password" };
const UPDATED_TITLE = "Password updated";

const fill = async (
  user: ReturnType<typeof userEvent.setup>,
  password = PASSWORD,
  confirmation = PASSWORD,
) => {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm new password"), confirmation);
  await user.click(screen.getByRole("button", UPDATE));
};

describe("ResetPasswordForm integration", () => {
  it("titles the page with its one h1, with or without a token", () => {
    const { unmount } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Choose a new password" }),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(<ResetPasswordForm token="" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "This link is not valid" }),
    ).toBeInTheDocument();
  });

  beforeEach(() => {
    mockPush.mockReset();
  });

  it("says the link is not valid when it carries no token, and offers a new one", async () => {
    const { container } = renderWithProviders(<ResetPasswordForm token="" />);

    expect(screen.getByText("This link is not valid")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("refuses mismatched passwords without sending anything", async () => {
    // No handler is declared: a request would fail the test (`onUnhandledRequest: "error"`).
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await fill(user, PASSWORD, "something-else-1");

    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(UPDATED_TITLE)).not.toBeInTheDocument();
  });

  it("sends the token with the new password and sends the user to sign in", async () => {
    const user = userEvent.setup();
    const body = jest.fn();
    server.use(
      http.post(RESET_ENDPOINT, async ({ request }) => {
        body(await request.json());
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    const { container } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);
    expect(await axe(container)).toHaveNoViolations();

    await fill(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: UPDATED_TITLE }),
    ).toBeInTheDocument();
    expect(body).toHaveBeenCalledWith({
      token: TOKEN,
      password: PASSWORD,
      passwordConfirmation: PASSWORD,
    });
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Go to login" }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows the server's own sentence when it rejects the token", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(RESET_ENDPOINT, () =>
        HttpResponse.json(
          { status: "error", message: "This reset link has expired. Request a new one." },
          { status: 400 },
        ),
      ),
    );

    renderWithProviders(<ResetPasswordForm token={TOKEN} />);
    await fill(user);

    expect(
      await screen.findByText("This reset link has expired. Request a new one."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/request failed with status code/i)).not.toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(RESET_ENDPOINT, async () => {
        await held;
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    renderWithProviders(<ResetPasswordForm token={TOKEN} />);
    await fill(user);

    expect(await screen.findByRole("button", { name: "Updating…" })).toBeDisabled();

    release();
    await waitFor(() => expect(screen.getByText(UPDATED_TITLE)).toBeInTheDocument());
  });
});
