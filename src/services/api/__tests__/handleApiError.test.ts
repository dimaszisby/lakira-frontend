import type { AxiosResponse } from "axios";
import { AxiosError } from "axios";

import { handleApiError } from "@/services/api/handleApiError";

const SESSION_EXPIRED_COPY = "Your session expired. Please log in again.";
const SERVER_SIDE_COPY = "Something went wrong on our side. Please try again later.";

const axiosError = ({
  status,
  data,
  message = "Request failed with status code 401",
}: {
  status?: number;
  data?: unknown;
  message?: string;
}) =>
  new AxiosError(
    message,
    undefined,
    undefined,
    undefined,
    status === undefined ? undefined : ({ status, data } as AxiosResponse),
  );

describe("handleApiError", () => {
  it("returns nothing for a cancelled request", () => {
    expect(handleApiError(new DOMException("aborted", "AbortError"))).toEqual([]);
  });

  // AC-1 — the defect. The backend sends this exact string for a wrong password.
  it("shows the server's message when a 401 carries one", () => {
    const result = handleApiError(
      axiosError({ status: 401, data: { message: "Invalid email or password" } }),
    );

    expect(result).toEqual(["Invalid email or password"]);
  });

  // AC-2 — the proxy tags the session it just gave up on, so this stays generic.
  it("shows the session copy when the proxy tags a 401 as SESSION_EXPIRED", () => {
    const result = handleApiError(
      axiosError({
        status: 401,
        data: { error: "Unauthorized", code: "SESSION_EXPIRED" },
      }),
    );

    expect(result).toEqual([SESSION_EXPIRED_COPY]);
  });

  // AC-4 — Axios fills `message` with boilerplate, which must never reach a user.
  it("falls back to the status copy when a 401 carries no server message", () => {
    const result = handleApiError(axiosError({ status: 401, data: undefined }));

    expect(result).toEqual([SESSION_EXPIRED_COPY]);
  });

  // AC-3 — sanitizeErrorMessage truncates and strips, it does not redact, so the
  // 5xx override is load-bearing rather than cosmetic.
  it("never shows a server message for a 5xx", () => {
    const result = handleApiError(
      axiosError({
        status: 500,
        data: { message: "ECONNREFUSED postgres_db:5432 in MetricRepo.findAll" },
      }),
    );

    expect(result).toEqual([SERVER_SIDE_COPY]);
  });

  it("shows the server's message for a 422 validation failure", () => {
    const result = handleApiError(
      axiosError({
        status: 422,
        data: { errors: ["Name is required", "Unit must be a string"] },
      }),
    );

    expect(result).toEqual(["Name is required", "Unit must be a string"]);
  });

  it("falls back to the status copy for a 403 with no server message", () => {
    const result = handleApiError(axiosError({ status: 403, data: undefined }));

    expect(result).toEqual(["You don't have permission to perform this action."]);
  });

  it("reports a connection problem when there is no response at all", () => {
    const result = handleApiError(axiosError({ status: undefined }));

    expect(result).toEqual(["We couldn't reach the server. Check your connection and try again."]);
  });

  it("sanitizes a server message before showing it", () => {
    const result = handleApiError(
      axiosError({ status: 409, data: { message: "  <b>Duplicate</b> name  " } }),
    );

    expect(result).toEqual(["bDuplicate/b name"]);
  });
});
