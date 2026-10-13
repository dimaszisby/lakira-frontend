import { render } from "@testing-library/react";
import { StrictMode } from "react";

import { RouteErrorPanel } from "@/components/ui/RouteErrorPanel";
import { resetClientErrorReports } from "@/lib/monitoring/report-client-error";

/**
 * The other suite mocks `reportClientError`, so it shows what the panel passes and not what the
 * server receives. This one leaves the reporter real and counts requests, under Strict Mode,
 * where the panel's effect runs twice.
 */
describe("RouteErrorPanel, the report it sends", () => {
  const fetchMock = jest.fn((..._args: unknown[]) => Promise.resolve(new Response(null)));
  let originalFetch: typeof globalThis.fetch;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetClientErrorReports();
    fetchMock.mockClear();
    originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it("posts one report for one error, in Strict Mode", () => {
    const error = Object.assign(new Error("render failed"), { digest: "1234567890" });

    render(
      <StrictMode>
        <RouteErrorPanel error={error} retry={jest.fn()} title="Unable to load this page" />
      </StrictMode>,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string }];
    expect(url).toBe("/api/observability/client-error");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ kind: "boundary", digest: "1234567890" });
  });
});
