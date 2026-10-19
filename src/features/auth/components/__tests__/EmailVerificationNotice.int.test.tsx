import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import EmailVerificationNotice from "@/features/auth/components/EmailVerificationNotice";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

// The only in-app way back for a user whose verification email went missing. No test of any
// kind covered it before (register row F-41).

const RESEND_ENDPOINT = "/api/proxy/auth/resend-verification";
const RESEND = { name: "Resend the verification email" };
const SENT = /^Sent\./;

describe("EmailVerificationNotice integration", () => {
  it("renders nothing once the address is verified", () => {
    const { container } = renderWithProviders(
      <EmailVerificationNotice emailVerifiedAt="2026-10-01T00:00:00.000Z" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("resends the email and says it was sent", async () => {
    const user = userEvent.setup();
    const sent = jest.fn();
    server.use(
      http.post(RESEND_ENDPOINT, () => {
        sent();
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    const { container } = renderWithProviders(<EmailVerificationNotice emailVerifiedAt={null} />);
    expect(screen.getByText("Confirm your email address")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", RESEND));

    expect(await screen.findByText(SENT)).toBeInTheDocument();
    expect(sent).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", RESEND)).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the server's own sentence when it refuses", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(RESEND_ENDPOINT, () =>
        HttpResponse.json(
          { status: "error", message: "A verification email was sent recently. Wait a minute." },
          { status: 429 },
        ),
      ),
    );

    renderWithProviders(<EmailVerificationNotice emailVerifiedAt={null} />);
    await user.click(screen.getByRole("button", RESEND));

    expect(
      await screen.findByText("A verification email was sent recently. Wait a minute."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/request failed with status code/i)).not.toBeInTheDocument();
    expect(screen.queryByText(SENT)).not.toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(RESEND_ENDPOINT, async () => {
        await held;
        return HttpResponse.json({ status: "success", message: "OK", data: { message: "OK" } });
      }),
    );

    renderWithProviders(<EmailVerificationNotice emailVerifiedAt={null} />);
    await user.click(screen.getByRole("button", RESEND));

    expect(screen.getByRole("button", RESEND)).toBeDisabled();
    expect(screen.getByRole("button", RESEND)).toHaveTextContent("Sending…");

    release();
    await waitFor(() => expect(screen.getByText(SENT)).toBeInTheDocument());
  });
});
