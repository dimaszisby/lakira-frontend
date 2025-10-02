"use client";

import { useEffect, useState } from "react";

import type { RelativeLast, TimeRangeValue } from "../types";

const RELATIVE_RE = /^\d+(h|d|w|m|y)$/;

type Props = {
  value: TimeRangeValue;
  onChange: (v: TimeRangeValue) => void;
};

const TimeRangePicker = ({ value, onChange }: Props) => {
  const [mode, setMode] = useState<"relative" | "absolute">(value.mode);

  // Local draft so users can type freely (e.g., "7" before "7d")
  const [draftLast, setDraftLast] = useState<string>(
    value.mode === "relative" ? value.last : "30d",
  );

  // Keep draft in sync with external value/mode
  useEffect(() => {
    if (value.mode === "relative") setDraftLast(value.last);
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Range mode"
        className="rounded-md border px-2 py-1"
        value={mode}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          const m = e.target.value as "relative" | "absolute";
          setMode(m);
          if (m === "relative") {
            const next: RelativeLast = isRelativeLast(draftLast) ? draftLast : "30d";
            onChange({ mode: "relative", last: next });
          } else {
            const end = new Date().toISOString();
            const start = new Date(Date.now() - 30 * 86400000).toISOString();
            onChange({ mode: "absolute", start, end });
          }
        }}
      >
        <option value="relative">Last</option>
        <option value="absolute">Custom</option>
      </select>

      {mode === "relative" ? (
        <input
          aria-label="Last"
          className="w-28 rounded-md border px-2 py-1"
          placeholder="e.g. 7d"
          pattern={RELATIVE_RE.source}
          title="Format: number + unit (h,d,w,m,y). Example: 7d"
          value={draftLast}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setDraftLast(raw);
            if (isRelativeLast(raw)) {
              onChange({ mode: "relative", last: raw });
            }
          }}
        />
      ) : (
        <>
          <input
            type="datetime-local"
            className="rounded-md border px-2 py-1"
            aria-label="Start"
            value={value.mode === "absolute" ? toLocal(value.start) : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value ? new Date(e.target.value).toISOString() : "";
              const cur =
                value.mode === "absolute"
                  ? value
                  : { mode: "absolute", start: "", end: "" as string };
              onChange({ mode: "absolute", start: v, end: cur.end });
            }}
          />
          <input
            type="datetime-local"
            className="rounded-md border px-2 py-1"
            aria-label="End"
            value={value.mode === "absolute" ? toLocal(value.end) : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const v = e.target.value ? new Date(e.target.value).toISOString() : "";
              const cur =
                value.mode === "absolute"
                  ? value
                  : { mode: "absolute", start: "", end: "" as string };
              onChange({ mode: "absolute", start: cur.start, end: v });
            }}
          />
        </>
      )}
    </div>
  );
};

export default TimeRangePicker;

// helpers
function toLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function isRelativeLast(s: string): s is RelativeLast {
  return RELATIVE_RE.test(s);
}
