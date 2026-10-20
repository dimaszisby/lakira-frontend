import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The first half of account recovery. The only browser check of it is a stack spec, which CI
// does not run (register row F-41).

const FORGOT_ENDPOINT = "/api/proxy/auth/forgot-password";
const EMAIL = "ada@example.com";
const SEND = { name: "Send reset link" };
const SENT_TITLE = "Check your email";

const typeEmailAndSend = async (user: ReturnType<typeof userEvent.setup>, email = EMAIL) => {
  await user.type(screen.getByLabelText("Email"), email);
  await user.click(screen.getByRole("button", SEND));
};

describe("ForgotPasswordForm integration", () => {
  it("titles the page with its one h1", () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeInTheDocument();
  });

  it("sends the address and says a link is on its way", async () => {
    const user = userEvent.setup();
    const body = jest.fn();
    server.use(
      http.post(FORGOT_ENDPOINT, async ({ request }) => {
        body(await request.json());
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    const { container } = renderWithProviders(<ForgotPasswordForm />);
    expect(await axe(container)).toHaveNoViolations();

    await typeEmailAndSend(user);

    expect(await screen.findByRole("heading", { level: 1, name: SENT_TITLE })).toBeInTheDocument();
    expect(body).toHaveBeenCalledWith({ email: EMAIL });
    expect(screen.getAllByRole("link", { name: "Back to login" })[0]).toHaveAttribute(
      "href",
      "/login",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("refuses an invalid address without sending anything", async () => {
    // No handler is declared: a request would fail the test (`onUnhandledRequest: "error"`).
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await typeEmailAndSend(user, "not-an-address");

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(SENT_TITLE)).not.toBeInTheDocument();
  });

  it("shows the server's own sentence when it refuses", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(FORGOT_ENDPOINT, () =>
        HttpResponse.json(
          { status: "error", message: "Too many reset requests. Try again later." },
          { status: 429 },
        ),
      ),
    );

    renderWithProviders(<ForgotPasswordForm />);
    await typeEmailAndSend(user);

    expect(
      await screen.findByText("Too many reset requests. Try again later."),
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
      http.post(FORGOT_ENDPOINT, async () => {
        await held;
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    renderWithProviders(<ForgotPasswordForm />);
    await typeEmailAndSend(user);

    expect(await screen.findByRole("button", { name: "Sending…" })).toBeDisabled();

    release();
    await waitFor(() => expect(screen.getByText(SENT_TITLE)).toBeInTheDocument());
  });
});
