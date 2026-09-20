import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { http, HttpResponse } from "msw";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { navItems } from "@/components/layout/type";
import { server } from "@/src/test-utils/msw/server";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
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

describe("Sidebar integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders navigation items and marks active route", () => {
    renderWithProviders(
      <Sidebar navItems={navItems} pathname="/metrics" isMobileOpen={false} onClose={jest.fn()} />,
    );

    expect(screen.getAllByRole("link", { name: /dashboard/i }).length).toBeGreaterThan(0);

    const metricLinks = screen.getAllByRole("link", { name: /metrics/i });
    expect(metricLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("opens logout confirmation modal and closes it on cancel", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Sidebar
        navItems={navItems}
        pathname="/dashboard"
        isMobileOpen={false}
        onClose={jest.fn()}
      />,
    );

    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    await user.click(logoutButtons[0]);

    expect(screen.getByRole("dialog", { name: /logout/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel logout/i }));
    expect(screen.queryByRole("dialog", { name: /logout/i })).not.toBeInTheDocument();
  });

  /**
   * Sign-out used to post to `/api/proxy/auth/logout`. That revoked the token
   * family upstream and changed nothing on this origin — the proxy strips
   * `Set-Cookie`, and the route that deletes the cookies was never reached. The
   * app then reported success and pushed to `/login`, which redirected back to
   * the dashboard on the cookie that was still there. The endpoint is the whole
   * fix, so it is what this asserts.
   */
  it("signs out through the session route, not the backend proxy", async () => {
    const user = userEvent.setup();
    const logoutCall = jest.fn();

    server.use(
      http.post("/api/auth/logout", () => {
        logoutCall();
        return HttpResponse.json({ ok: true });
      }),
    );

    renderWithProviders(
      <Sidebar
        navItems={navItems}
        pathname="/dashboard"
        isMobileOpen={false}
        onClose={jest.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /logout/i })[0]);
    await user.click(screen.getByRole("button", { name: /confirm logout/i }));

    await waitFor(() => expect(logoutCall).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });

  it("keeps the user where they are when sign-out fails", async () => {
    const user = userEvent.setup();

    server.use(http.post("/api/auth/logout", () => new HttpResponse(null, { status: 500 })));

    renderWithProviders(
      <Sidebar
        navItems={navItems}
        pathname="/dashboard"
        isMobileOpen={false}
        onClose={jest.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /logout/i })[0]);
    await user.click(screen.getByRole("button", { name: /confirm logout/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /confirm logout/i })).toBeEnabled(),
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderWithProviders(
      <Sidebar
        navItems={navItems}
        pathname="/dashboard"
        isMobileOpen={false}
        onClose={jest.fn()}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
