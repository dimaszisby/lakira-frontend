import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ComponentPropsWithoutRef } from "react";

import Header from "@/components/layout/Header";
import { APP_NAME } from "@/constants/app";

// Next's Link schedules a prefetch-visibility update after render, outside act.
jest.mock("next/link", () => {
  type LinkShimProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

  const LinkShim = ({ href, children, ...rest }: LinkShimProps) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );

  return LinkShim;
});

describe("Header", () => {
  it("renders the wordmark as a link to the home page", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: APP_NAME })).toHaveAttribute("href", "/");
  });

  it("links to the login and register pages", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
  });

  // It reads no state: with no provider around it there is nothing that could
  // hide it (kit `unquarantine-layout-files`, D-01).
  it("renders inside a banner landmark with no provider around it", () => {
    render(<Header />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Header />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
