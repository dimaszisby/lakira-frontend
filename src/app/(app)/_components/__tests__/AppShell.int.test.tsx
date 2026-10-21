import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

import AppShell from "../AppShell";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("next/link", () => {
  type LinkShimProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

  const LinkShim = ({ href, onClick, children, ...rest }: LinkShimProps) => (
    <a
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  );

  return LinkShim;
});

const LOGOUT_ENDPOINT = "/api/auth/logout";

const renderShell = () =>
  renderWithProviders(
    <AppShell>
      <div>Page content</div>
    </AppShell>,
  );

const confirmSignOut = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Sign out" }));
  // The confirm button shares the trigger's name (kit `mobile-sign-out`, D-02).
  const dialog = await screen.findByRole("dialog", { name: "Sign out" });
  await user.click(within(dialog).getByRole("button", { name: "Sign out" }));
};

describe("AppShell integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders the page inside the shell's main landmark", () => {
    renderShell();

    expect(screen.getByRole("main")).toHaveTextContent("Page content");
  });

  /**
   * Sign-out used to post to `/api/proxy/auth/logout`. That revoked the token
   * family upstream and changed nothing on this origin — the proxy strips
   * `Set-Cookie`, and the route that deletes the cookies was never reached. The
   * app then reported success and pushed to `/login`, which redirected back to
   * the dashboard on the cookie that was still there. The endpoint is the whole
   * fix, so it is what this asserts.
   *
   * This case lived in `Sidebar.int.test.tsx` until the sidebar stopped owning
   * the mutation (kit `unquarantine-layout-files`, D-02).
   */
  it("signs out through the session route, not the backend proxy", async () => {
    const logoutCall = jest.fn();

    server.use(
      http.post(LOGOUT_ENDPOINT, () => {
        logoutCall();
        return HttpResponse.json({ ok: true });
      }),
    );

    renderShell();
    await confirmSignOut();

    await waitFor(() => expect(logoutCall).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("keeps the user where they are when sign-out fails", async () => {
    server.use(http.post(LOGOUT_ENDPOINT, () => new HttpResponse(null, { status: 500 })));

    renderShell();
    await confirmSignOut();

    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog", { name: "Sign out" })).getByRole("button", {
          name: "Sign out",
        }),
      ).toBeEnabled(),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderShell();

    expect(await axe(container)).toHaveNoViolations();
  });
});
