import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";

import Layout from "@/components/layout/Layout";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";

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

describe("Layout integration", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders child content inside main landmark", () => {
    renderWithProviders(
      <Layout onLogout={jest.fn()} isLoggingOut={false}>
        <div>Metrics content</div>
      </Layout>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Metrics content");
    // Focusable from script, for the skip link and for RouteErrorPanel after a retry; not tabbable.
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("exposes skip link and primary navigation landmarks", () => {
    renderWithProviders(
      <Layout onLogout={jest.fn()} isLoggingOut={false}>
        <div>Main area</div>
      </Layout>,
    );

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /primary sidebar navigation/i }),
    ).toBeInTheDocument();
  });

  // Below `lg` the bottom bar navigates and the account page signs out. The drawer this replaced
  // was never opened, and its links and button stayed in the tab order off screen (kit
  // `mobile-sign-out`, D-01; register F-48, F-49). Removed, not hidden, so there is one of each.
  it("renders no mobile drawer and a single sign-out control", () => {
    renderWithProviders(
      <Layout onLogout={jest.fn()} isLoggingOut={false}>
        <div>Main area</div>
      </Layout>,
    );

    expect(
      screen.queryByRole("complementary", { name: /mobile navigation/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /mobile sidebar navigation/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderWithProviders(
      <Layout onLogout={jest.fn()} isLoggingOut={false}>
        <div>Main area</div>
      </Layout>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
