import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { ReactNode } from "react";

import { RouteErrorPanel } from "@/components/ui/RouteErrorPanel";
import { reportClientError } from "@/lib/monitoring/report-client-error";

jest.mock("@/lib/monitoring/report-client-error", () => ({
  reportClientError: jest.fn(),
}));

const TITLE = "Unable to load this page";
const THROWN = "SELECT * FROM users WHERE email = 'jane.doe@example.com' failed";

const errorWith = (digest?: string): Error & { digest?: string } =>
  Object.assign(new Error(THROWN), digest ? { digest } : {});

describe("RouteErrorPanel", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(reportClientError).mockClear();
    // The panel logs the error it was given; that is expected here.
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("shows the title and fixed copy, and nothing of what was thrown", () => {
    render(<RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} />);

    const panel = screen.getByRole("alert");
    expect(panel).toHaveTextContent(TITLE);
    expect(panel).toHaveTextContent("Something went wrong on our side.");
    expect(panel).not.toHaveTextContent("SELECT");
    expect(panel).not.toHaveTextContent("jane.doe@example.com");
  });

  it("shows the digest as a reference when the error has one", () => {
    render(<RouteErrorPanel error={errorWith("1234567890")} retry={jest.fn()} title={TITLE} />);

    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("shows no reference line when the error has no digest", () => {
    render(<RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} />);

    expect(screen.queryByText(/Reference/)).not.toBeInTheDocument();
  });

  it("is a level-one heading by default and level two when asked", () => {
    const { rerender } = render(
      <RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: TITLE })).toBeInTheDocument();

    rerender(
      <RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} headingLevel={2} />,
    );
    expect(screen.getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
  });

  it("calls retry from the keyboard", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    render(<RouteErrorPanel error={errorWith()} retry={retry} title={TITLE} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("reports an error once, and again only for a different error", () => {
    const first = errorWith();
    const { rerender } = render(<RouteErrorPanel error={first} retry={jest.fn()} title={TITLE} />);
    rerender(<RouteErrorPanel error={first} retry={jest.fn()} title={TITLE} />);
    expect(reportClientError).toHaveBeenCalledTimes(1);
    expect(reportClientError).toHaveBeenCalledWith(first, "boundary");

    const second = errorWith("abc");
    rerender(<RouteErrorPanel error={second} retry={jest.fn()} title={TITLE} />);
    expect(reportClientError).toHaveBeenCalledTimes(2);
    expect(reportClientError).toHaveBeenLastCalledWith(second, "boundary");
  });

  describe("when the panel unmounts, as after a successful retry", () => {
    const Page = ({ hasError, children }: { hasError: boolean; children?: ReactNode }) => (
      <main tabIndex={-1}>
        {hasError ? <RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} /> : null}
        {children}
      </main>
    );

    it("moves focus from the Try again button to main", () => {
      const { rerender } = render(<Page hasError />);
      screen.getByRole("button", { name: "Try again" }).focus();

      rerender(<Page hasError={false} />);

      expect(screen.getByRole("main")).toHaveFocus();
    });

    it("leaves focus where the user put it", () => {
      const { rerender } = render(
        <Page hasError>
          <button type="button">Metrics</button>
        </Page>,
      );
      // Into the panel, then out to the page, as a user who presses Try again and then picks a link.
      screen.getByRole("button", { name: "Try again" }).focus();
      screen.getByRole("button", { name: "Metrics" }).focus();

      rerender(
        <Page hasError={false}>
          <button type="button">Metrics</button>
        </Page>,
      );

      expect(screen.getByRole("button", { name: "Metrics" })).toHaveFocus();
    });

    it("leaves focus alone when it never entered the panel, as on Strict Mode's extra mount", () => {
      // `next dev` mounts, cleans up and mounts again (reactStrictMode: true), so the cleanup runs
      // while the panel is still showing and focus is on the body.
      render(<Page hasError />, { reactStrictMode: true });

      expect(document.body).toHaveFocus();
    });

    it("does nothing when no main is above it", () => {
      const { rerender } = render(
        <div>
          <RouteErrorPanel error={errorWith()} retry={jest.fn()} title={TITLE} />
        </div>,
      );
      screen.getByRole("button", { name: "Try again" }).focus();

      rerender(<div />);

      expect(document.body).toHaveFocus();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <RouteErrorPanel error={errorWith("1234567890")} retry={jest.fn()} title={TITLE} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
