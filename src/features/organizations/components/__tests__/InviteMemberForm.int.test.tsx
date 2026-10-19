import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import InviteMemberForm from "@/features/organizations/components/InviteMemberForm";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders, TEST_ORGANIZATION_ID } from "@/src/test-utils/renderWithProviders";

// Inviting into the active organization. The only browser check of it is a stack spec, which CI
// does not run (register row F-41). The request URL carries the organization, so a test that
// matches it shows the tenant reached the call.

const INVITES_URL = `*/organizations/${TEST_ORGANIZATION_ID}/invites`;
const EMAIL = "grace@example.com";
const SEND = { name: "Send invitation" };
const SENT_NOTE = "Invitation sent.";

const acknowledged = () =>
  HttpResponse.json(
    { status: "success", message: "Invitation sent", data: { message: "Invitation sent" } },
    { status: 201 },
  );

describe("InviteMemberForm integration", () => {
  it("invites a member to the active organization and clears the field", async () => {
    const user = userEvent.setup();
    const body = jest.fn();
    server.use(
      http.post(INVITES_URL, async ({ request }) => {
        body(await request.json());
        return acknowledged();
      }),
    );

    const { container } = renderWithProviders(<InviteMemberForm />);
    expect(await axe(container)).toHaveNoViolations();

    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(screen.getByRole("button", SEND));

    expect(await screen.findByText(SENT_NOTE)).toBeInTheDocument();
    expect(body).toHaveBeenCalledWith({ email: EMAIL, role: "member" });
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends the role chosen", async () => {
    const user = userEvent.setup();
    const body = jest.fn();
    server.use(
      http.post(INVITES_URL, async ({ request }) => {
        body(await request.json());
        return acknowledged();
      }),
    );

    renderWithProviders(<InviteMemberForm />);
    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.selectOptions(screen.getByLabelText("Role"), "admin");
    await user.click(screen.getByRole("button", SEND));

    await waitFor(() => expect(body).toHaveBeenCalledWith({ email: EMAIL, role: "admin" }));
  });

  it("refuses an invalid address without sending anything", async () => {
    // No handler is declared: a request would fail the test (`onUnhandledRequest: "error"`).
    const user = userEvent.setup();
    renderWithProviders(<InviteMemberForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-address");
    await user.click(screen.getByRole("button", SEND));

    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(SENT_NOTE)).not.toBeInTheDocument();
  });

  it("shows the server's own sentence when it refuses", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(INVITES_URL, () =>
        HttpResponse.json(
          { status: "error", message: "An invitation for this email is already pending." },
          { status: 409 },
        ),
      ),
    );

    renderWithProviders(<InviteMemberForm />);
    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(screen.getByRole("button", SEND));

    expect(
      await screen.findByText("An invitation for this email is already pending."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/request failed with status code/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue(EMAIL);
  });

  it("disables the form while the request is in flight", async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(INVITES_URL, async () => {
        await held;
        return acknowledged();
      }),
    );

    renderWithProviders(<InviteMemberForm />);
    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(screen.getByRole("button", SEND));

    expect(await screen.findByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();

    release();
    await waitFor(() => expect(screen.getByText(SENT_NOTE)).toBeInTheDocument());
  });
});
