import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { navItems } from "@/components/layout/type";
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
      <Sidebar
        navItems={navItems}
        pathname="/metrics"
        isMobileOpen={false}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getAllByRole("link", { name: /dashboard/i }).length).toBeGreaterThan(0);

    const metricLinks = screen.getAllByRole("link", { name: /metrics/i });
    expect(metricLinks.some((link) => link.getAttribute("class")?.includes("text-brand-primary"))).toBe(
      true,
    );
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
