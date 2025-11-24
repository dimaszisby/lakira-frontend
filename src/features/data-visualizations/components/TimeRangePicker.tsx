"use client";

import { CaretDown, PencilSimple } from "phosphor-react";
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
      <div className="relative inline-flex items-center">
        <select
          aria-label="Range mode"
          className="
          /*
          =
          space for the chevron
          */ w-full appearance-none rounded-xl border border-border bg-bg py-2 pl-3 pr-6
          text-sm
          outline-none ring-0 focus:border-brand-accent
        "
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

        <span
          className="
          pointer-events-none
          absolute inset-y-0 right-2
          flex items-center 
        "
          aria-hidden="true"
        >
          <CaretDown size={14} className="text-brand-accent" />
        </span>
      </div>

      <div className="flex flex-row items-center gap-2">
        {mode === "relative" ? (
          <div className="relative flex h-9 w-28 flex-row items-center overflow-clip rounded-xl border-border bg-bg">
            <input
              aria-label="Last"
              className="h-full w-full rounded-xl border border-border bg-transparent px-3 outline-none ring-0 focus:border-brand-accent"
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

            <span
              className="
          pointer-events-none
          absolute inset-y-0 right-2
          flex items-center
        "
              aria-hidden="true"
            >
              <PencilSimple size={16} className="text-brand-accent" />
            </span>
          </div>
        ) : (
          <>
            <input
              type="datetime-local"
              className="rounded-xl border px-2 py-1 outline-none ring-0 focus:border-brand-accent"
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
              className="rounded-xl border px-2 py-1 outline-none ring-0 focus:border-brand-accent"
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
