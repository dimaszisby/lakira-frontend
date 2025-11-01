"use client";

import { Check, Palette, PencilSimpleLine } from "phosphor-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/src/lib/cn";

export type ColorFieldProps = {
  id?: string;
  value: string | null; // "#RRGGBB" | null
  onChange: (hex: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultColor?: string; // used when value is null
  className?: string;
  "aria-label"?: string;
};

// Defaults
// TODO: Import/uses real color system
const PALETTE = [
  "#E897A3",
  "#A8C28B",
  "#82AEBE",
  "#F5C49A",
  "#578C9C",
  "#7C9B63",
  "#C76576",
  "#212529",
  "#FFFFFF",
  "#FDF7F4",
  "#EDE8E4",
  "#B7D3DD",
];

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

function normalizeHex(input: string | null | undefined, fallback: string) {
  if (!input) return fallback.toUpperCase();
  const v = input.trim();
  if (v.startsWith("#") && v.length === 7) return v.toUpperCase();
  // allow 3-digit shorthand
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const r = v[1],
      g = v[2],
      b = v[3];
    return ("#" + r + r + g + g + b + b).toUpperCase();
  }
  return fallback.toUpperCase();
}

const ColorField = ({
  id,
  value,
  onChange,
  disabled,
  placeholder = "#FFFFFF",
  defaultColor = "#FFFFFF",
  className,
  ...aria
}: ColorFieldProps) => {
  const uid = useId();
  const inputId = id ?? `color-input-${uid}`;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => normalizeHex(value, defaultColor));
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

  const current = useMemo(() => normalizeHex(value, defaultColor), [value, defaultColor]);

  // sync draft when external value changes
  useEffect(() => setDraft(current), [current]);

  // click outside to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popoverRef.current || !btnRef.current) return;
      if (popoverRef.current.contains(t) || btnRef.current.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const commitHex = (hex: string) => {
    if (HEX_RE.test(hex)) {
      onChange(hex.toUpperCase());
      setOpen(false);
    }
  };

  const triggerNativePicker = () => {
    if (nativeRef.current && !disabled) {
      nativeRef.current.click();
    }
  };

  return (
    <div className={cn("relative")}>
      <label htmlFor={inputId} className="sr-only">
        Color
      </label>

      {/* Field shell */}
      <div
        className={cn(
          "flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-white py-2 px-2 shadow-sm",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
        aria-disabled={disabled || undefined}
      >
        {/* Swatch */}
        <span
          className="inline-block aspect-square h-8 rounded-xl shadow-sm ring-1 ring-black/5"
          style={{ backgroundColor: current }}
          aria-hidden="true"
        />

        {/* Hex text (editable) */}
        <input
          id={inputId}
          type="text"
          inputMode="text"
          maxLength={7}
          value={draft}
          onChange={(e) =>
            setDraft(
              e.target.value.startsWith("#")
                ? e.target.value.toUpperCase()
                : `#${e.target.value.toUpperCase()}`,
            )
          }
          onBlur={() => {
            // If valid on blur, commit; otherwise revert to current
            if (HEX_RE.test(draft)) onChange(draft.toUpperCase());
            else setDraft(current);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full border-none bg-transparent text-base font-medium text-gray-900 outline-none placeholder:text-gray-400",
          )}
          aria-invalid={!HEX_RE.test(draft)}
          {...aria}
        />

        {/* Edit (opens popover) */}
        <button
          type="button"
          ref={btnRef}
          onClick={() => !disabled && setOpen((s) => !s)}
          className={cn(
            "grid place-items-center rounded-lg p-2 outline-none transition hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400",
            disabled && "pointer-events-none",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${inputId}-popover`}
          title="Open color picker"
        >
          <PencilSimpleLine size={20} weight="duotone" className="text-violet-500" />
        </button>
      </div>

      {/* Popover */}
      {open ? (
        <div
          id={`${inputId}-popover`}
          role="dialog"
          aria-label="Choose color"
          ref={popoverRef}
          className="absolute z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded ring-1 ring-black/5"
                style={{ backgroundColor: draft }}
              />
              <span className="text-sm text-gray-600">Preview</span>
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium",
                HEX_RE.test(draft)
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "cursor-not-allowed bg-gray-100 text-gray-400",
              )}
              onClick={() => commitHex(draft)}
              disabled={!HEX_RE.test(draft)}
              title="Use this color"
            >
              <Check size={16} /> Apply
            </button>
          </div>

          {/* Quick palette */}
          <div className="mb-4 grid grid-cols-6 gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setDraft(c.toUpperCase());
                  commitHex(c);
                }}
                className="h-8 w-8 rounded-lg ring-1 ring-black/5 hover:ring-2 hover:ring-violet-400"
                style={{ backgroundColor: c }}
                aria-label={`Choose ${c}`}
              />
            ))}
          </div>

          {/* Hex editor */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              maxLength={7}
              className={cn(
                "flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm outline-none",
                HEX_RE.test(draft) ? "focus:ring-2 focus:ring-violet-300" : "ring-2 ring-red-200",
              )}
              placeholder="#RRGGBB"
              aria-label="Hex value"
            />
            <button
              type="button"
              onClick={triggerNativePicker}
              className="flex-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              title="Advanced picker"
            >
              <Palette size={20} className="text-violet-600" />
            </button>
            {/* Hidden native input to get OS color dialog when needed */}
            <input
              ref={nativeRef}
              type="color"
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              onBlur={() => HEX_RE.test(draft) && commitHex(draft)}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ColorField;
