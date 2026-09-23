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

const DATE_ONLY = "2025-11-04";
const DATE_TIME = "2025-11-04T09:30";

describe("date-io utilities", () => {
  describe("parseDate", () => {
    it("parses date-only and datetime-local strings", () => {
      const dateOnly = parseDate(DATE_ONLY);
      const dateTime = parseDate(DATE_TIME);

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
      const expected = parseDate(DATE_TIME);
      expected?.setSeconds(0, 0);
      expect(toISOZ("2025-11-04T09:30:45")).toBe(expected?.toISOString());
      expect(toISOZ("bad")).toBeUndefined();
    });

    it("emits date-only ISO strings or undefined when invalid", () => {
      expect(toISODateOnly(DATE_TIME)).toBe(DATE_ONLY);
      expect(toISODateOnly(undefined)).toBeUndefined();
    });

    it("keeps local offset information when requested", () => {
      const result = toISOWithOffset(DATE_TIME);
      expect(result).toMatch(/2025-11-04T09:30:00[+-]\d{2}:\d{2}/);
    });
  });

  describe("UI helpers", () => {
    it("formats date-only and datetime-local inputs", () => {
      expect(formatDateInput(DATE_TIME)).toBe(DATE_ONLY);
      expect(formatDateInput("bad-input")).toBe("");
      expect(formatDateTimeLocalInput(DATE_ONLY)).toBe("2025-11-04T00:00");
    });

    it("produces deterministic human-readable strings", () => {
      expect(formatHumanShort(DATE_ONLY)).toBe("04/11/25");
      expect(formatHumanShort(DATE_TIME, { withTime: true, sep: "-", year: "numeric" })).toBe(
        "04-11-2025 09:30",
      );
    });

    it("formats ranges with intelligent elision", () => {
      expect(formatHumanRange(DATE_ONLY, "2025-11-06", { locale: "en-US" })).toBe("4–6 Nov 2025");
      expect(
        formatHumanRange("2025-11-04T09:00", "2025-11-04T11:30", {
          withTime: true,
          locale: "en-US",
        }),
      ).toBe("4 Nov 2025 09:00–11:30");
    });
  });

  describe("validation helpers", () => {
    it("flags valid inputs consistently", () => {
      expect(isValidDate(DATE_ONLY)).toBe(true);
      expect(isValidDate("")).toBe(false);
      expect(isValidDate("nope")).toBe(false);
    });
  });
});
