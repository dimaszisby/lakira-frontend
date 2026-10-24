import { ZodMessages } from "@/constants/zod-messages";
import { logFormSchema } from "@/features/metric-logs/types";

/**
 * The log form shows the value field's message under the input. With no
 * message of its own the field showed zod's wording, which zod 4 changed to
 * "Too small: expected number to be >=0" (kit `zod-4-upgrade`, D-02).
 */

const valid = {
  metricId: "11111111-1111-4111-8111-111111111111",
  logValue: 3,
  loggedAt: "2026-10-24T09:00:00.000Z",
};

const valueMessage = (logValue: unknown) => {
  const result = logFormSchema.safeParse({ ...valid, logValue });
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === "logValue")?.message;
};

describe("logFormSchema", () => {
  it("accepts zero and a positive value", () => {
    expect(valueMessage(0)).toBeUndefined();
    expect(valueMessage(12.5)).toBeUndefined();
  });

  it("names a negative value in the form's own words", () => {
    expect(valueMessage(-1)).toBe(ZodMessages.metricLog.logValueNegative);
  });

  it("asks for a value when the field is empty", () => {
    // An empty number input reaches the schema as NaN through `valueAsNumber`.
    expect(valueMessage(Number.NaN)).toBe(ZodMessages.metricLog.logValueRequired);
    expect(valueMessage(undefined)).toBe(ZodMessages.metricLog.logValueRequired);
  });
});
