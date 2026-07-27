import { sanitizeErrorMessage } from "@/lib/sanitizeErrorMessage";

describe("sanitizeErrorMessage", () => {
  it("returns empty string when input is falsy", () => {
    expect(sanitizeErrorMessage(null)).toBe("");
    expect(sanitizeErrorMessage("")).toBe("");
  });

  it("truncates, trims, and strips control/html characters", () => {
    const raw = " \t<Error message>\u0007with control chars and trailing   ";
    const sanitized = sanitizeErrorMessage(raw, 20);

    expect(sanitized).toBe("Error message with");
  });

  it("respects default max length when not provided", () => {
    const long = "A".repeat(500);
    expect(sanitizeErrorMessage(long)).toHaveLength(200);
  });
});
