import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import BottomNavigationBar from "@/components/layout/BottomNavigationBar";
import { navItems } from "@/components/layout/type";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

jest.mock("next/link", () => {
  type LinkShimProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

  const LinkShim = ({ href, onClick, children, ...rest }: LinkShimProps) => {
    return (
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
  };

  return LinkShim;
});

describe("BottomNavigationBar integration", () => {
  it("renders navigation links and marks the active route", () => {
    renderWithProviders(
      <BottomNavigationBar
        navItems={navItems}
        pathname="/metrics"
      />,
    );

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /metrics/i })).toHaveAttribute("aria-current", "page");
  });

  it("calls onLinkClick when a navigation link is clicked", async () => {
    const user = userEvent.setup();
    const onLinkClick = jest.fn();

    renderWithProviders(
      <BottomNavigationBar
        navItems={navItems}
        pathname="/dashboard"
        onLinkClick={onLinkClick}
      />,
    );

    await user.click(screen.getByRole("link", { name: /account/i }));
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderWithProviders(
      <BottomNavigationBar
        navItems={navItems}
        pathname="/dashboard"
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
