import { screen } from "@testing-library/react";
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

  // The confirmation and its cases moved to `SignOutControl.test.tsx` (kit `mobile-sign-out`).
  // The drawer that held a second, off-screen copy of every control is gone (D-01, register F-49).
  it("renders one sign-out control and no mobile drawer", () => {
    renderSidebar();

    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
    expect(
      screen.queryByRole("navigation", { name: /mobile sidebar navigation/i }),
    ).not.toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderSidebar();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
