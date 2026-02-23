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
      <Layout>
        <div>Metrics content</div>
      </Layout>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("Metrics content");
  });

  it("exposes skip link and primary navigation landmarks", () => {
    renderWithProviders(
      <Layout>
        <div>Main area</div>
      </Layout>,
    );

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /primary sidebar navigation/i })).toBeInTheDocument();
  });

  it("has no critical accessibility violations", async () => {
    const { container } = renderWithProviders(
      <Layout>
        <div>Main area</div>
      </Layout>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
