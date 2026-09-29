import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import AcceptInvitePanel from "@/features/organizations/components/AcceptInvitePanel";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const ACCEPT_URL = "*/invites/accept";
const TOKEN = "plain-invite-token";
const SUCCESS_TITLE = "You're in";

const successResponse = () => HttpResponse.json({ status: "success", message: "ok", data: {} });

// Every case renders under Strict Mode, as `next dev` does (reactStrictMode: true).
// Its double mount is what left this panel on "Accepting your invitation…" forever
// on @tanstack/query-core 5.90.7, although the membership was created; see
// docs/internal/todos/2026-09-29-todo-token-panels-stall-in-strict-mode.md.
// `reactStrictMode` wraps the whole tree, providers included. A `<StrictMode>` nested
// inside `renderWithProviders` doubles renders but not effects, so it cannot reproduce this.
const renderPanel = (token: string) =>
  renderWithProviders(<AcceptInvitePanel token={token} />, { reactStrictMode: true });

describe("AcceptInvitePanel", () => {
  it("shows success once the invite is accepted, spending the token exactly once", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(ACCEPT_URL, async ({ request }) => {
        bodies.push(await request.json());
        return successResponse();
      }),
    );

    renderPanel(TOKEN);

    expect(await screen.findByText(SUCCESS_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to login" })).toBeInTheDocument();
    expect(bodies).toEqual([{ token: TOKEN }]);
  });

  it("shows the failure state when the invite is rejected", async () => {
    server.use(
      http.post(ACCEPT_URL, () =>
        HttpResponse.json({ status: "fail", message: "Invalid invite" }, { status: 400 }),
      ),
    );

    renderPanel(TOKEN);

    expect(await screen.findByText("That invitation did not work")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid invite");
  });

  it("asks for a fresh invitation and sends nothing when the token is missing", async () => {
    let requested = false;
    server.use(
      http.post(ACCEPT_URL, () => {
        requested = true;
        return successResponse();
      }),
    );

    renderPanel("");

    expect(await screen.findByText("This link is not valid")).toBeInTheDocument();
    expect(requested).toBe(false);
  });

  it("has no axe violations in the success state", async () => {
    server.use(http.post(ACCEPT_URL, () => successResponse()));

    const { container } = renderPanel(TOKEN);
    await screen.findByText(SUCCESS_TITLE);

    expect(await axe(container)).toHaveNoViolations();
  });
});
