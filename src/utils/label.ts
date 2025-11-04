/**
 * Safely display any value in UI, handling:
 * - undefined, null, empty string, empty array/object
 * - numbers (including 0), booleans
 * - Date objects
 * - Optional custom formatter
 */
type SafeLabelValue =
  | string
  | number
  | boolean
  | Date
  | Array<unknown>
  | Record<string, unknown>
  | undefined
  | null;
type SafeLabelFormatter = (val: SafeLabelValue) => string;

export function safeLabel(
  val: SafeLabelValue,
  fallback: string = "-",
  formatter?: SafeLabelFormatter,
): string {
  if (val === undefined || val === null) return fallback;

  // String: non-empty, trimmed
  if (typeof val === "string") {
    const s = val.trim();
    return s.length > 0 ? s : fallback;
  }

  // Boolean: display True/False explicitly
  if (typeof val === "boolean") {
    return val ? "True" : "False";
  }

  // Number: always display (even 0 is meaningful), NaN fallback
  if (typeof val === "number") {
    return isNaN(val) ? fallback : String(val);
  }

  // Date: pretty format (or use toISOString)
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallback : val.toLocaleString();
  }

  // Array: display comma-separated, fallback if empty
  if (Array.isArray(val)) {
    if (val.length === 0) return fallback;
    return val.map((item) => safeLabel(item as SafeLabelValue, fallback)).join(", ");
  }

  // Object: display JSON, fallback if empty object
  if (typeof val === "object") {
    if (Object.keys(val).length === 0) return fallback;
    // If a formatter is provided, use it (e.g., show just a specific field)
    if (formatter) return formatter(val);
    // Fallback: JSON.stringify with small indentation
    return JSON.stringify(val, null, 2);
  }

  if (undefined === val || null === val) {
    return fallback;
  }

  // Otherwise, fallback to string conversion
  return String(val);
}
