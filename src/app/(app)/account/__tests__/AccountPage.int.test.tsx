import { screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";

import AccountPage from "@/app/(app)/account/page";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const PROFILE_ENDPOINT = "/api/proxy/auth/profile";
const TEST_EMAIL = "testuser001@email.com";

const profile = {
  id: "user-1",
  username: "testuser001",
  email: TEST_EMAIL,
  role: "user",
  isPublicProfile: true,
  emailVerifiedAt: "2026-02-20T08:00:00.000Z",
};

const mockProfile = (status: number, body?: unknown) =>
  http.get(PROFILE_ENDPOINT, () =>
    status === 200
      ? HttpResponse.json({ status: "success", message: "ok", data: body })
      : new HttpResponse(null, { status }),
  );

/**
 * This page was wrapped in `withAuth` until 2026-09-22. The HOC gated the route
 * a third time — `src/proxy.ts` and `(app)/layout.tsx` already do — and fetched
 * the profile a second time to fill `userAtom`, which `useAuthProfileQuery`
 * here fills anyway. These tests pin what the page does now that it is alone.
 */
describe("AccountPage integration", () => {
  it("renders the profile the query returns", async () => {
    server.use(mockProfile(200, profile));

    renderWithProviders(<AccountPage />);

    expect(await screen.findByText(TEST_EMAIL)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /account/i, level: 1 })).toBeInTheDocument();
  });

  it("offers the theme switcher alongside the profile", async () => {
    server.use(mockProfile(200, profile));

    renderWithProviders(<AccountPage />);

    expect(await screen.findByRole("radiogroup", { name: /theme/i })).toBeInTheDocument();
  });

  /**
   * The behaviour change worth pinning. `withAuth` pushed to `/login` when the
   * profile did not arrive; the page now shows its own recovery card instead.
   *
   * A failed profile is not proof the session is dead — `fetchUserProfile`
   * swallows the error and returns `null` by design, so "no profile" and "could
   * not load it" are indistinguishable here. A genuinely dead session is caught
   * by the proxy, which clears both cookies on a 401 refresh cannot rescue.
   */
  it("shows a recovery card rather than redirecting when the profile does not load", async () => {
    // 401 rather than 500: it is the case withAuth actually redirected on, and
    // axios-retry would retry a 5xx three times with backoff before the query
    // ever settled.
    server.use(mockProfile(401));

    renderWithProviders(<AccountPage />);

    expect(await screen.findByText(/unable to load your profile/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    server.use(mockProfile(200, profile));

    const { container } = renderWithProviders(<AccountPage />);
    await screen.findByText(TEST_EMAIL);

    await waitFor(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
