import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import VerifyEmailPanel from "@/features/auth/components/VerifyEmailPanel";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const VERIFY_URL = "*/auth/verify-email";
const TOKEN = "plain-verify-token";
const SUCCESS_TITLE = "Email verified";

const successResponse = () => HttpResponse.json({ status: "success", message: "ok", data: {} });

// Every case renders under Strict Mode, as `next dev` does (reactStrictMode: true).
// Its double mount is what left this panel on "Verifying your email…" forever on
// @tanstack/query-core 5.90.7, although the request succeeded; see
// docs/internal/todos/2026-09-29-todo-token-panels-stall-in-strict-mode.md.
// `reactStrictMode` wraps the whole tree, providers included. A `<StrictMode>` nested
// inside `renderWithProviders` doubles renders but not effects, so it cannot reproduce this.
const renderPanel = (token: string) =>
  renderWithProviders(<VerifyEmailPanel token={token} />, { reactStrictMode: true });

describe("VerifyEmailPanel", () => {
  it("shows success once the token is accepted, spending it exactly once", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(VERIFY_URL, async ({ request }) => {
        bodies.push(await request.json());
        return successResponse();
      }),
    );

    renderPanel(TOKEN);

    expect(await screen.findByText(SUCCESS_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to login" })).toBeInTheDocument();
    expect(bodies).toEqual([{ token: TOKEN }]);
  });

  it("shows the failure state when the token is rejected", async () => {
    server.use(
      http.post(VERIFY_URL, () =>
        HttpResponse.json({ status: "fail", message: "Invalid or expired token" }, { status: 400 }),
      ),
    );

    renderPanel(TOKEN);

    expect(await screen.findByText("Verification failed")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid or expired token");
  });

  it("asks for a new link and sends nothing when the token is missing", async () => {
    let requested = false;
    server.use(
      http.post(VERIFY_URL, () => {
        requested = true;
        return successResponse();
      }),
    );

    renderPanel("");

    expect(await screen.findByText("This link is not valid")).toBeInTheDocument();
    expect(requested).toBe(false);
  });

  it("has no axe violations in the success state", async () => {
    server.use(http.post(VERIFY_URL, () => successResponse()));

    const { container } = renderPanel(TOKEN);
    await screen.findByText(SUCCESS_TITLE);

    expect(await axe(container)).toHaveNoViolations();
  });
});
