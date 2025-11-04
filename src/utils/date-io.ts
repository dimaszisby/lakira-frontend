import type { ISODateString, ISODateTimeString } from "@/src/generics/date/aliases";

/** Private utils */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD (local)
const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // YYYY-MM-DDTHH:mm (local)
const pad2 = (n: number) => `${n}`.padStart(2, "0");
const isValid = (d: Date) => !Number.isNaN(d.getTime());

// * ========== Parsing ========== *

/**
 * @category IO: Parsing
 * Parses many date inputs into a **local** `Date` instance.
 *
 * Accepted inputs:
 * - `"YYYY-MM-DD"` → treated as local midnight (00:00:00.000).
 * - `"YYYY-MM-DDTHH:mm"` → treated as local time (seconds = 0).
 * - Any other ISO/JS date string → delegated to `new Date(...)` (offset preserved if present).
 * - `Date` instance → cloned if valid.
 *
 * Returns `null` if `v` is falsy or not a valid date.
 *
 * Use this to normalize values coming from forms, URL params, or API before formatting/serializing.
 *
 * @example
 * parseDate("2025-11-04");                  // -> Tue Nov 04 2025 00:00 (local)
 * parseDate("2025-11-04T09:30");            // -> Tue Nov 04 2025 09:30 (local)
 * parseDate("2025-11-04T02:30:00Z");        // -> Adjusted to local timezone from UTC
 * parseDate(new Date("bad"));               // -> null
 * parseDate(null);                          // -> null
 */
export function parseDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isValid(v) ? new Date(v) : null;

  const s = v.trim();
  if (DATE_ONLY_RE.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    return isValid(dt) ? dt : null;
  }
  if (DATETIME_LOCAL_RE.test(s)) {
    const [datePart, timePart] = s.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return isValid(dt) ? dt : null;
  }
  const dt = new Date(s);
  return isValid(dt) ? dt : null;
}

// * ========== API Serializers ========== *

/**
 * API serializer
 * Serializes a value to **UTC** ISO-8601 ending with `Z` (e.g. `2025-11-04T02:30:00.000Z`).
 *
 * - Uses `parseDate` rules, then converts to UTC.
 * - **Normalizes seconds and millis to zero** to align with `<input type="datetime-local">`.
 * - Returns `undefined` when invalid — convenient for `setValueAs` in react-hook-form.
 *
 * Use when your API expects UTC timestamps.
 *
 * @example
 * const payload = { scheduledAt: toISOZ(form.getValues("scheduledAt")) };
 * /// invalid -> { scheduledAt: undefined }
 *
 * @example
 * toISOZ("2025-11-04T09:30");  // -> "2025-11-04T02:30:00.000Z" (if local is UTC+07)
 * toISOZ("bad");               // -> undefined
 */
export function toISOZ(v?: string | Date | null): ISODateTimeString | undefined {
  const d = parseDate(v ?? null);
  if (!d) return undefined;
  // Normalize seconds for consistency with datetime-local inputs.
  d.setSeconds(0, 0);
  return d.toISOString() as ISODateTimeString;
}

/**
 * @category IO: API Serializers
 * Serializes a value to a local **date-only** ISO string `YYYY-MM-DD`.
 *
 * - Uses `parseDate` rules.
 * - Returns `undefined` when invalid.
 *
 * Useful for date-only fields (birthdays, filters, daily buckets) where time is not relevant.
 *
 * @example
 * const filters = { startDate: toISODateOnly(range.start), endDate: toISODateOnly(range.end) };
 *
 * @example
 * toISODateOnly("2025-11-04T09:30"); // -> "2025-11-04"
 * toISODateOnly("bad");              // -> undefined
 */
export function toISODateOnly(v?: string | Date | null): ISODateString | undefined {
  const s = formatDateInput(v);
  return s === "" ? undefined : (s as ISODateString);
}

/**
 * @category IO: API Serializers
 * Serializes a value to ISO-8601 with the **local timezone offset** (e.g. `+07:00`).
 *
 * - Uses `parseDate` rules and keeps local wall-clock time.
 * - Includes **seconds** (does not zero them).
 * - Returns `undefined` when invalid.
 *
 * Use when the server expects an offset-preserving timestamp (e.g., reporting systems, SQL `TIMESTAMP WITH TIME ZONE` ingestion,
 * or when you want to retain the user's local context).
 *
 * @example
 * toISOWithOffset("2025-11-04T09:30"); // -> "2025-11-04T09:30:00+07:00" (Asia/Jakarta example)
 * toISOWithOffset("2025-11-04");       // -> "2025-11-04T00:00:00+07:00"
 * toISOWithOffset("bad");              // -> undefined
 */
export function toISOWithOffset(v?: string | Date | null): string | undefined {
  const d = parseDate(v ?? null);
  if (!d) return undefined;
  const offMin = -d.getTimezoneOffset(); // minutes east of UTC
  const sign = offMin >= 0 ? "+" : "-";
  const abs = Math.abs(offMin);
  const offH = pad2(Math.trunc(abs / 60));
  const offM = pad2(abs % 60);
  const yyyy = d.getFullYear();
  const MM = pad2(d.getMonth() + 1);
  const DD = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${MM}-${DD}T${HH}:${mm}:${ss}${sign}${offH}:${offM}`;
}

// * ========= UI Formatters ========== *

/**
 * @category IO: UI
 * Formats a value for `<input type="date">` as `YYYY-MM-DD`.
 *
 * - Uses `parseDate` rules.
 * - Returns `""` (empty string) when invalid — ideal for controlled inputs.
 *
 * @example
 * <input type="date" value={formatDateInput(form.watch("date"))} ... />
 *
 * @example
 * formatDateInput("2025-11-04");            // -> "2025-11-04"
 * formatDateInput("2025-11-04T09:30");      // -> "2025-11-04"
 * formatDateInput("bad");                   // -> ""
 */
export function formatDateInput(v?: string | Date | null): ISODateString {
  const d = parseDate(v ?? null);
  if (!d) return "" as ISODateString;
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}` as ISODateString;
}

/**
 * @category IO: UI
 * Formats a value for `<input type="datetime-local">` as `YYYY-MM-DDTHH:mm`.
 *
 * - Uses `parseDate` rules.
 * - Seconds are omitted to match the control's granularity.
 * - Returns `""` (empty string) when invalid — ideal for controlled inputs.
 *
 * @example
 * <input type="datetime-local" value={formatDateTimeLocalInput(value)} onChange={...} />
 *
 * @example
 * formatDateTimeLocalInput("2025-11-04T09:30"); // -> "2025-11-04T09:30"
 * formatDateTimeLocalInput("2025-11-04");       // -> "2025-11-04T00:00"
 * formatDateTimeLocalInput("bad");              // -> ""
 */
export function formatDateTimeLocalInput(v?: string | Date | null): string {
  const d = parseDate(v ?? null);
  if (!d) return "";
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const h = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

/**
 * @category IO: UI
 * Human-readable date formatter using `Intl.DateTimeFormat`.
 *
 * - Parses the input via `parseDate` to preserve your local/offset rules.
 * - When `withTime` is `true`, includes 24h `HH:mm` in the output.
 * - `locale` is optional; if omitted, the environment/browser locale is used.
 * - Returns `fallback` (default `"-"`) when the input is invalid/falsy.
 *
 * ⚠️ Output is **locale-dependent** (month names/order vary with locale).
 * If you need a fixed pattern string, reintroduce a pattern-based formatter only where required.
 *
 * @param input     A date-like value (`string | Date | null | undefined`)
 * @param options   { withTime?: boolean; locale?: string | string[]; fallback?: string }
 * @returns         Formatted string (or `fallback` when invalid)
 *
 * @example
 * /// Display-only cells:
 * formatHuman("2025-11-04");                           // e.g., "4 Nov 2025" (en-GB), "Nov 4, 2025" (en-US)
 * formatHuman("2025-11-04T09:30", { withTime: true }); // e.g., "4 November 2025 09:30"
 *
 * @example
 * /// Force British English short month:
 * formatHuman(new Date(), { locale: "en-GB" });        // "4 Nov 2025"
 *
 * @example
 * /// React usage in a table cell:
 * <td>{formatHuman(row.createdAt, { withTime: true })}</td>
 *
 * @example
 * /// Defensive UI (invalid shows "-"):
 * formatHuman("bad", { fallback: "-" });               // "-"
 */
export function formatHuman(
  input?: string | Date | null,
  opts: {
    withTime?: boolean;
    locale?: string | string[];
    fallback?: string; // default "-"
  } = {},
): string {
  const d = parseDate(input ?? null);
  if (!d) return opts.fallback ?? "-";

  const { withTime = false, locale } = opts;
  const fmtOpts: Intl.DateTimeFormatOptions = withTime
    ? {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    : { day: "numeric", month: "short", year: "numeric" };

  return new Intl.DateTimeFormat(locale, fmtOpts).format(d);
}

/**
 * @category IO: UI
 * Fixed-pattern short formatter: **DD/MM/YY** (optionally appends ` HH:mm`).
 *
 * - Locale-independent (manual assembly) for stable chips, filters, exports.
 * - Uses `parseDate` rules; returns `fallback` (default `"-"`) when invalid.
 *
 * @param input    A date-like value (`string | Date | null | undefined`)
 * @param opts
 *   - withTime?: boolean        → append " HH:mm" (24h)
 *   - sep?: "/" | "-" | "."     → date separator, default "/"
 *   - year?: "2-digit"|"numeric"→ YY (default) or YYYY
 *   - fallback?: string         → default "-"
 *
 * @example
 * formatHumanShort("2025-11-04");                       // "04/11/25"
 * formatHumanShort("2025-11-04T09:30", { withTime: true }); // "04/11/25 09:30"
 * formatHumanShort("2025-11-04", { sep: "-", year: "numeric" }); // "04-11-2025"
 * formatHumanShort("bad");                              // "-"
 */
export function formatHumanShort(
  input?: string | Date | null,
  opts: {
    withTime?: boolean;
    sep?: "/" | "-" | ".";
    year?: "2-digit" | "numeric";
    fallback?: string;
  } = {},
): string {
  const d = parseDate(input ?? null);
  if (!d) return opts.fallback ?? "-";

  const pad2 = (n: number) => `${n}`.padStart(2, "0");
  const sep = opts.sep ?? "/";
  const yearMode = opts.year ?? "2-digit";

  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const yy = pad2(yyyy % 100);

  let out = `${dd}${sep}${mm}${sep}${yearMode === "numeric" ? yyyy : yy}`;
  if (opts.withTime) {
    const HH = pad2(d.getHours());
    const MM = pad2(d.getMinutes());
    out += ` ${HH}:${MM}`;
  }
  return out;
}

/**
 * @category IO: UI
 * Human-friendly range formatter with intelligent elision.
 *
 * Produces compact strings by omitting repeated parts:
 * - Same-day (no time):           "4 Nov 2025"
 * - Same-day with times:          "4 Nov 2025 09:00–11:30"
 * - Same month & year:            "4–6 Nov 2025"
 * - Same year, different months:  "28 Dec–2 Jan 2025"
 * - Different years:              "28 Dec 2025–2 Jan 2026"
 *
 * - Uses `parseDate` rules; swaps `start/end` if out of order.
 * - When one side is invalid, returns the valid side formatted via `formatHuman(...)`.
 * - When both invalid, returns `fallback` (default `"-"`).
 *
 * @param start    start date-like
 * @param end      end date-like
 * @param opts
 *   - withTime?: boolean          → add 24h `HH:mm` (time shown on same-day or both sides if different days)
 *   - locale?: string | string[]  → for month names (defaults to environment)
 *   - monthStyle?: "short"|"long" → month name length (default "short")
 *   - fallback?: string           → default "-"
 *
 * @example
 * formatHumanRange("2025-11-04", "2025-11-06");                 // "4–6 Nov 2025"
 * formatHumanRange("2025-12-28", "2026-01-02");                 // "28 Dec 2025–2 Jan 2026"
 * formatHumanRange("2025-11-04T09:00", "2025-11-04T11:30", { withTime: true });
 * /// "4 Nov 2025 09:00–11:30"
 *
 * @example
 * /// Single valid side:
 * formatHumanRange("bad", "2025-11-04");                        // "4 Nov 2025"
 */
export function formatHumanRange(
  start?: string | Date | null,
  end?: string | Date | null,
  opts: {
    withTime?: boolean;
    locale?: string | string[];
    monthStyle?: "short" | "long";
    fallback?: string;
  } = {},
): string {
  const s = parseDate(start ?? null);
  const e = parseDate(end ?? null);
  const fallback = opts.fallback ?? "-";

  if (!s && !e) return fallback;
  if (s && !e) return formatHuman(s, { withTime: opts.withTime, locale: opts.locale, fallback });
  if (!s && e) return formatHuman(e, { withTime: opts.withTime, locale: opts.locale, fallback });

  // At this point both are valid Dates.
  let a = s as Date;
  let b = e as Date;
  if (a.getTime() > b.getTime()) [a, b] = [b, a]; // normalize order

  const sameY = a.getFullYear() === b.getFullYear();
  const sameM = sameY && a.getMonth() === b.getMonth();
  const sameD = sameM && a.getDate() === b.getDate();

  // Helpers
  const monthFmt = new Intl.DateTimeFormat(opts.locale, {
    month: opts.monthStyle ?? "short",
  });
  const pad2 = (n: number) => `${n}`.padStart(2, "0");
  const day = (d: Date) => d.getDate();
  const mon = (d: Date) => monthFmt.format(d);
  const yr = (d: Date) => d.getFullYear();
  const timeHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  if (sameD) {
    // Single day
    if (opts.withTime) {
      const tA = timeHM(a);
      const tB = timeHM(b);
      if (tA !== tB) {
        return `${day(a)} ${mon(a)} ${yr(a)} ${tA}–${tB}`;
      }
    }
    return `${day(a)} ${mon(a)} ${yr(a)}`;
  }

  if (sameM) {
    // 4–6 Nov 2025  (optionally times on each side)
    const left = opts.withTime ? `${day(a)} ${timeHM(a)}` : `${day(a)}`;
    const right = opts.withTime
      ? `${day(b)} ${mon(b)} ${yr(b)} ${timeHM(b)}`
      : `${day(b)} ${mon(b)} ${yr(b)}`;
    return `${left}–${right}`;
  }

  if (sameY) {
    // 4 Nov–6 Dec 2025
    const left = opts.withTime ? `${day(a)} ${mon(a)} ${timeHM(a)}` : `${day(a)} ${mon(a)}`;
    const right = opts.withTime
      ? `${day(b)} ${mon(b)} ${yr(b)} ${timeHM(b)}`
      : `${day(b)} ${mon(b)} ${yr(b)}`;
    return `${left}–${right}`;
  }

  // Cross-year: 28 Dec 2025–2 Jan 2026
  const left = opts.withTime
    ? `${day(a)} ${mon(a)} ${yr(a)} ${timeHM(a)}`
    : `${day(a)} ${mon(a)} ${yr(a)}`;
  const right = opts.withTime
    ? `${day(b)} ${mon(b)} ${yr(b)} ${timeHM(b)}`
    : `${day(b)} ${mon(b)} ${yr(b)}`;
  return `${left}–${right}`;
}

/**
 * @category IO: Validation
 * Public validity checker for date-ish inputs.
 *
 * Accepts:
 * - `string` → parsed via `parseDate` (supports "YYYY-MM-DD", "YYYY-MM-DDTHH:mm", full ISO with/without offset)
 * - `Date`   → validated directly
 * - anything else → invalid
 *
 * Returns `true` only when the value can be parsed into a valid `Date`.
 * Prefer this over ad-hoc checks so all call sites follow the same parsing rules.
 *
 * @example
 * isValidDate("2025-11-04");           // true (local midnight)
 * isValidDate("2025-11-04T09:30");     // true (local time)
 * isValidDate("2025-11-04T02:30:00Z"); // true (UTC converted to local)
 * isValidDate("bad");                  // false
 * isValidDate(null);                   // false
 *
 * @example
 * /// Guard before submitting a filter payload:
 * const start = form.getValues("startDate");
 * if (isValidDate(start)) {
 *   payload.startDate = toISODateOnly(start);
 * }
 */
export function isValidDate(input: unknown): boolean {
  if (!input) return false;
  const d = typeof input === "string" ? parseDate(input) : input instanceof Date ? input : null;
  return !!(d && !Number.isNaN(d.getTime()));
}

/* -----------------------------------------------------------------------------
 * Deprecated shims (kept for incremental migration)
 * -----------------------------------------------------------------------------
 */

/**
 * @deprecated Use `formatDateInput`.
 *
 * Returns `YYYY-MM-DD` for valid inputs or `""` when invalid (for `<input type="date">`).
 */
export function toInputDate(d?: string | Date | null): ISODateString {
  return formatDateInput(d);
}

/**
 * @deprecated Use `toISOZ`.
 *
 * Returns a UTC `...Z` ISO string with seconds/millis normalized, or `undefined` when invalid.
 * Safe for `setValueAs` in RHF.
 */
export function toIsoFromLocalInput(v?: Date | string | null): ISODateTimeString | undefined {
  return toISOZ(v);
}

/**
 * @deprecated Use `formatDateTimeLocalInput`.
 *
 * Returns `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`, or `""` when invalid.
 */
export function toInputLocal(d?: string | Date | null): string {
  return formatDateTimeLocalInput(d);
}

/**
 * @deprecated Use `toISODateOnly`.
 *
 * Returns a local date-only `YYYY-MM-DD`, or `undefined` when invalid.
 * (Shim signature returns `ISODateString | undefined`.)
 */
export function fromInputDate(v?: string | null): ISODateString | undefined {
  return toISODateOnly(v ?? null);
}

/**
 * @deprecated Use `toISODateOnly` directly if you want `undefined` on invalid.
 *
 * This shim adapts UI semantics: it maps invalid to `null` instead of `undefined`.
 * Returns `YYYY-MM-DD` or `null` when invalid.
 */
export function toLocalISODate(d: Date | null): string | null {
  const s = formatDateInput(d);
  return s === "" ? null : s;
}

/**
 * @deprecated Use `toISOWithOffset`.
 *
 * Returns ISO with local offset (e.g. `+07:00`) or `null` when invalid.
 */
export function toLocalISOString(d: Date | null): string | null {
  return toISOWithOffset(d) ?? null;
}

/**
 * @deprecated Use `parseDate`.
 *
 * Same behavior as `parseDate`, returning a local `Date` instance or `null` when invalid.
 */
export function parseToDate(v: string | null | undefined): Date | null {
  return parseDate(v ?? null);
}
