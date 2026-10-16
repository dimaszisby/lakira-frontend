import { shouldRetryProfile } from "../profile.query";

const failedWith = (status: number) => ({ response: { status } });

describe("shouldRetryProfile", () => {
  it.each([400, 401, 403, 404])(
    "does not retry when the profile request fails with %i",
    (status) => {
      expect(shouldRetryProfile(0, failedWith(status))).toBe(false);
    },
  );

  it.each([429, 500, 503])("retries when the profile request fails with %i", (status) => {
    expect(shouldRetryProfile(0, failedWith(status))).toBe(true);
  });

  it("retries a failure with no status, such as a network error", () => {
    expect(shouldRetryProfile(0, new Error("Network Error"))).toBe(true);
  });

  it("stops retrying after two failures", () => {
    expect(shouldRetryProfile(1, failedWith(503))).toBe(true);
    expect(shouldRetryProfile(2, failedWith(503))).toBe(false);
  });
});
