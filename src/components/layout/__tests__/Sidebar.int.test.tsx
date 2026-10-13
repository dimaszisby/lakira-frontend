import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import Sidebar from "@/components/layout/Sidebar";
import type { SidebarProps } from "@/components/layout/type";
import { navItems } from "@/components/layout/type";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

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

const renderSidebar = (props: Partial<SidebarProps> = {}) =>
  renderWithProviders(
    <Sidebar
      navItems={navItems}
      pathname="/dashboard"
      isMobileOpen={false}
      onClose={jest.fn()}
      onLogout={jest.fn()}
      isLoggingOut={false}
      {...props}
    />,
  );

describe("Sidebar integration", () => {
  it("renders navigation items and marks active route", () => {
    renderSidebar({ pathname: "/metrics" });

    expect(screen.getAllByRole("link", { name: /dashboard/i }).length).toBeGreaterThan(0);

    const metricLinks = screen.getAllByRole("link", { name: /metrics/i });
    expect(metricLinks.some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("opens logout confirmation modal and closes it on cancel", async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn();

    renderSidebar({ onLogout });

    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    await user.click(logoutButtons[0]);

    expect(screen.getByRole("dialog", { name: /logout/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel logout/i }));
    expect(screen.queryByRole("dialog", { name: /logout/i })).not.toBeInTheDocument();
    expect(onLogout).not.toHaveBeenCalled();
  });

  // What signing out does is the caller's: `AppShell.int.test.tsx` asserts the
  // endpoint and the redirect. The sidebar only asks, then hands over.
  it("calls onLogout once when the confirmation is accepted", async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn();

    renderSidebar({ onLogout });

    await user.click(screen.getAllByRole("button", { name: /logout/i })[0]);
    expect(onLogout).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /confirm logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button while sign-out is in flight", async () => {
    const user = userEvent.setup();
    const onLogout = jest.fn();

    renderSidebar({ onLogout, isLoggingOut: true });

    await user.click(screen.getAllByRole("button", { name: /logout/i })[0]);

    const confirm = screen.getByRole("button", { name: /confirm logout/i });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Logging Out...");

    await user.click(confirm);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderSidebar();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
