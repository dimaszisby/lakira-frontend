import { ZodMessages } from "@/constants/zod-messages";
import {
  zAlertThresholds,
  zDateOptional,
  zDisplayOptions,
  zEmail,
  zGoalEnabled,
  zLogType,
  zMetricCategoryColor,
  zPositiveFloat,
  zUsername,
  zUUID,
} from "@/constants/zod-rules";

/**
 * What the zod atoms do, pinned before the move from zod 3 to zod 4 (kit
 * `zod-4-upgrade`). Every case passed on zod 3.25.76; the upgrade keeps them as
 * they are. The messages are the ones users read, so a change of major version
 * must not swap them for zod's own wording.
 */

/** The first issue's message, or undefined when the value parses. */
const messageFor = (schema: { safeParse: (v: unknown) => unknown }, value: unknown) => {
  const result = schema.safeParse(value) as
    | { success: true }
    | { success: false; error: { issues: { message: string }[] } };
  return result.success ? undefined : result.error.issues[0]?.message;
};

describe("zod atoms", () => {
  it("accepts a backend id and rejects anything else with the ID message", () => {
    expect(messageFor(zUUID, "123e4567-e89b-42d3-a456-426614174000")).toBeUndefined();
    expect(messageFor(zUUID, "11111111-1111-4111-8111-111111111111")).toBeUndefined();
    expect(messageFor(zUUID, "not-an-id")).toBe(ZodMessages.common.invalidUUID);
  });

  it("reads a blank date as no date, and refuses one that is not a date", () => {
    expect(zDateOptional.parse("")).toBeUndefined();
    expect(zDateOptional.parse("   ")).toBeUndefined();
    expect(zDateOptional.parse("2026-10-24")).toEqual(new Date("2026-10-24"));
    // Refused by `z.coerce.date()` itself, in zod's words, before the refine
    // that carries `ZodMessages.common.invalidDate` runs; on zod 3 that read
    // "Invalid date". Only the refusal is pinned.
    expect(messageFor(zDateOptional, "not a date")).toEqual(expect.any(String));
  });

  it("fills an atom's default when the value is absent", () => {
    expect(zGoalEnabled.parse(undefined)).toBe(false);
    expect(zMetricCategoryColor.parse(undefined)).toBe("#E897A3");
    expect(zAlertThresholds.parse(undefined)).toBe(80);
    expect(zDisplayOptions.parse(undefined)).toEqual({
      showOnDashboard: false,
      priority: null,
      chartType: null,
      color: null,
    });
  });

  it("keeps the given value over the default", () => {
    expect(zGoalEnabled.parse(true)).toBe(true);
    expect(zAlertThresholds.parse(25)).toBe(25);
  });

  it("returns the repository's own messages, not zod's", () => {
    expect(messageFor(zEmail, "nope")).toBe(ZodMessages.user.emailInvalid);
    expect(messageFor(zUsername, "ab")).toBe(ZodMessages.user.usernameMin);
    expect(messageFor(zAlertThresholds, -1)).toBe(ZodMessages.metricSettings.alertThresholdMin);
    expect(messageFor(zAlertThresholds, 101)).toBe(ZodMessages.metricSettings.alertThresholdMax);
    expect(messageFor(zPositiveFloat, -1)).toBe(ZodMessages.metricLog.logValueNonNegative);
  });

  it("names a missing log value and a missing log type in the repository's words", () => {
    expect(messageFor(zPositiveFloat, undefined)).toBe(ZodMessages.metricLog.logValueRequired);
    expect(messageFor(zLogType, undefined)).toBe(ZodMessages.metricLog.logTypeInvalid);
  });
});
