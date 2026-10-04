import { reportClientError } from "@/lib/monitoring/report-client-error";

jest.mock("@/lib/monitoring/report-client-error", () => ({ reportClientError: jest.fn() }));

const mockReport = reportClientError as jest.MockedFunction<typeof reportClientError>;

/** jsdom has no PromiseRejectionEvent; the listener only reads `reason`. */
const rejection = (reason: unknown): Event =>
  Object.assign(new Event("unhandledrejection"), { reason });

describe("instrumentation-client", () => {
  beforeAll(async () => {
    await import("../instrumentation-client");
  });

  beforeEach(() => {
    mockReport.mockClear();
  });

  it("reports an uncaught error", () => {
    const error = new Error("boom");

    window.dispatchEvent(new ErrorEvent("error", { error, message: error.message }));

    expect(mockReport).toHaveBeenCalledWith(error, "uncaught");
  });

  it("ignores an error event with no Error object", () => {
    // A cross-origin script, or the ResizeObserver loop notice.
    window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));

    expect(mockReport).not.toHaveBeenCalled();
  });

  it("reports an unhandled promise rejection with its reason", () => {
    const reason = new Error("rejected");

    window.dispatchEvent(rejection(reason));

    expect(mockReport).toHaveBeenCalledWith(reason, "unhandled-rejection");
  });
});
