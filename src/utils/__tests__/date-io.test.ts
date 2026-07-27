import {
  formatDateInput,
  formatDateTimeLocalInput,
  formatHumanRange,
  formatHumanShort,
  isValidDate,
  parseDate,
  toISODateOnly,
  toISOWithOffset,
  toISOZ,
} from "@/utils/date-io";

describe("date-io utilities", () => {
  describe("parseDate", () => {
    it("parses date-only and datetime-local strings", () => {
      const dateOnly = parseDate("2025-11-04");
      const dateTime = parseDate("2025-11-04T09:30");

      expect(dateOnly).not.toBeNull();
      expect(dateOnly?.getFullYear()).toBe(2025);
      expect(dateOnly?.getMonth()).toBe(10); // zero-indexed
      expect(dateOnly?.getDate()).toBe(4);
      expect(dateTime).not.toBeNull();
      expect(dateTime?.getHours()).toBe(9);
      expect(dateTime?.getMinutes()).toBe(30);
    });

    it("returns null for invalid values", () => {
      expect(parseDate("not-a-date")).toBeNull();
      expect(parseDate(null)).toBeNull();
    });
  });

  describe("serializers", () => {
    it("normalizes to UTC ISO strings with zeroed seconds", () => {
      const expected = parseDate("2025-11-04T09:30");
      expected?.setSeconds(0, 0);
      expect(toISOZ("2025-11-04T09:30:45")).toBe(expected?.toISOString());
      expect(toISOZ("bad")).toBeUndefined();
    });

    it("emits date-only ISO strings or undefined when invalid", () => {
      expect(toISODateOnly("2025-11-04T09:30")).toBe("2025-11-04");
      expect(toISODateOnly(undefined)).toBeUndefined();
    });

    it("keeps local offset information when requested", () => {
      const result = toISOWithOffset("2025-11-04T09:30");
      expect(result).toMatch(/2025-11-04T09:30:00[+-]\d{2}:\d{2}/);
    });
  });

  describe("UI helpers", () => {
    it("formats date-only and datetime-local inputs", () => {
      expect(formatDateInput("2025-11-04T09:30")).toBe("2025-11-04");
      expect(formatDateInput("bad-input")).toBe("");
      expect(formatDateTimeLocalInput("2025-11-04")).toBe("2025-11-04T00:00");
    });

    it("produces deterministic human-readable strings", () => {
      expect(formatHumanShort("2025-11-04")).toBe("04/11/25");
      expect(formatHumanShort("2025-11-04T09:30", { withTime: true, sep: "-", year: "numeric" })).toBe(
        "04-11-2025 09:30",
      );
    });

    it("formats ranges with intelligent elision", () => {
      expect(formatHumanRange("2025-11-04", "2025-11-06", { locale: "en-US" })).toBe("4–6 Nov 2025");
      expect(
        formatHumanRange("2025-11-04T09:00", "2025-11-04T11:30", { withTime: true, locale: "en-US" }),
      ).toBe("4 Nov 2025 09:00–11:30");
    });
  });

  describe("validation helpers", () => {
    it("flags valid inputs consistently", () => {
      expect(isValidDate("2025-11-04")).toBe(true);
      expect(isValidDate("")).toBe(false);
      expect(isValidDate("nope")).toBe(false);
    });
  });
});
