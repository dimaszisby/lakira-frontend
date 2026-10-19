import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readdirSync } from "fs";
import path from "path";
import type { ComponentType } from "react";

import { reportClientError } from "@/lib/monitoring/report-client-error";
import DashboardError from "@/src/app/(app)/dashboard/error";
import AppAreaError from "@/src/app/(app)/error";
import MetricDetailError from "@/src/app/(app)/metrics/[metricId]/error";
import AuthAreaError from "@/src/app/(auth)/error";
import GlobalError from "@/src/app/global-error";

jest.mock("@/lib/monitoring/report-client-error", () => ({
  reportClientError: jest.fn(),
}));

/** Every `error.tsx` under `src/app`, as a path from the repository root. */
const errorFilesOnDisk = (): string[] =>
  (readdirSync(path.join(process.cwd(), "src", "app"), { recursive: true }) as string[])
    .filter((file) => path.basename(file) === "error.tsx")
    .map((file) => path.posix.join("src/app", file.split(path.sep).join("/")))
    .sort();

type BoundaryProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * Every `error.tsx` under `src/app`, with the title it shows. `global-error.tsx` is not here: it
 * renders its own document and has its own copy.
 *
 * `level` is the title's heading level: 1 where the panel is the page's only heading, 2 where a
 * layout above the boundary keeps the page's h1 (the dashboard's title, the metric's name).
 */
const BOUNDARIES: readonly {
  name: string;
  file: string;
  Boundary: ComponentType<BoundaryProps>;
  title: string;
  level: 1 | 2;
}[] = [
  {
    name: "(app) group",
    file: "src/app/(app)/error.tsx",
    Boundary: AppAreaError,
    title: "Unable to load this page",
    level: 1,
  },
  {
    name: "(auth) group",
    file: "src/app/(auth)/error.tsx",
    Boundary: AuthAreaError,
    title: "Unable to load this page",
    level: 1,
  },
  {
    name: "dashboard",
    file: "src/app/(app)/dashboard/error.tsx",
    Boundary: DashboardError,
    title: "Unable to load dashboard",
    level: 2,
  },
  {
    name: "metric detail",
    file: "src/app/(app)/metrics/[metricId]/error.tsx",
    Boundary: MetricDetailError,
    title: "Unable to load metric",
    level: 2,
  },
];

const SECRET_MESSAGE = "connect ECONNREFUSED 10.0.0.7:5432 for jane.doe@example.com";

describe("route error boundaries", () => {
  let consoleErrorSpy: jest.SpyInstance;

  it("covers every error.tsx under src/app", () => {
    // A boundary added later has to be added to the list above, or this fails.
    expect(BOUNDARIES.map(({ file }) => file).sort()).toEqual(errorFilesOnDisk());
  });

  beforeEach(() => {
    jest.mocked(reportClientError).mockClear();
    // Each boundary logs the error it caught; that is expected here.
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe.each(BOUNDARIES)("$name", ({ Boundary, title, level }) => {
    it("shows its title and never the error's message", () => {
      render(<Boundary error={new Error(SECRET_MESSAGE)} retry={jest.fn()} />);

      expect(screen.getByRole("heading", { name: title, level })).toBeInTheDocument();
      expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
      expect(document.body).not.toHaveTextContent("jane.doe@example.com");
    });

    it("re-fetches the segment when the user tries again", async () => {
      const user = userEvent.setup();
      const retry = jest.fn();
      render(<Boundary error={new Error(SECRET_MESSAGE)} retry={retry} />);

      await user.click(screen.getByRole("button", { name: "Try again" }));

      // `retry`, not `reset`: `reset` only clears the error, `retry` fetches the segment again
      // (Next 16.3). No boundary here accepts `reset` any more.
      expect(retry).toHaveBeenCalledTimes(1);
    });

    it("reports the error once", () => {
      const error = new Error(SECRET_MESSAGE);
      const { rerender } = render(<Boundary error={error} retry={jest.fn()} />);
      rerender(<Boundary error={error} retry={jest.fn()} />);

      expect(reportClientError).toHaveBeenCalledTimes(1);
      expect(reportClientError).toHaveBeenCalledWith(error, "boundary");
    });
  });

  // Not in the table: it renders its own document, and its copy is its own.
  describe("global-error", () => {
    it("shows fixed copy and never the error's message", () => {
      render(<GlobalError error={new Error(SECRET_MESSAGE)} retry={jest.fn()} />);

      expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent("jane.doe@example.com");
    });

    it("re-fetches when the user tries again", async () => {
      const user = userEvent.setup();
      const retry = jest.fn();
      render(<GlobalError error={new Error(SECRET_MESSAGE)} retry={retry} />);

      await user.click(screen.getByRole("button", { name: "Try again" }));

      // `retry`, as every boundary above: with `reset` this page could not recover a server
      // error, since it re-rendered the same failed payload (register row F-46).
      expect(retry).toHaveBeenCalledTimes(1);
    });
  });
});
