"use client";

import { Check, Palette, PencilSimpleLine } from "phosphor-react";
import React, { useEffect, useId, useRef, useState } from "react";

import { COLOR_FIELD_PRESET_HEXES, DEFAULT_COLOR_HEX } from "@/constants/color-presets";
import { cn } from "@/src/lib/cn";

export type ColorFieldProps = {
  id?: string;
  value: string | null; // "#RRGGBB" | null
  onChange: (hex: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultColor?: string;
  className?: string;
  "aria-label"?: string;
};

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;
const HEX_SHORT_RE = /^#([0-9A-Fa-f]{3})$/;

function toValidHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim();
  if (HEX_RE.test(v)) return v.toUpperCase();
  if (HEX_SHORT_RE.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return ("#" + r + r + g + g + b + b).toUpperCase();
  }
  return null;
}

function normalizeHex(input: string | null | undefined, fallback: string) {
  return toValidHex(input) ?? toValidHex(fallback) ?? DEFAULT_COLOR_HEX;
}

function toDraftHexInput(rawInput: string): string {
  const raw = rawInput.toUpperCase().replace(/\s/g, "");
  if (!raw) return "";
  return `#${raw.replace(/^#+/, "").replace(/#/g, "")}`;
}

const ColorField = ({
  id,
  value,
  onChange,
  disabled,
  placeholder = DEFAULT_COLOR_HEX,
  defaultColor = DEFAULT_COLOR_HEX,
  className,
  ...aria
}: ColorFieldProps) => {
  const uid = useId();
  const inputId = id ?? `color-input-${uid}`;
  const current = normalizeHex(value, defaultColor);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);
  const [isEditingInput, setIsEditingInput] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);

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
    const normalized = toValidHex(hex);
    if (normalized) {
      onChange(normalized);
      setDraft(normalized);
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
          "flex h-12 items-center gap-3 rounded-2xl border border-border bg-surface px-2 py-2 shadow-sm",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
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
          value={isEditingInput ? draft : current}
          onFocus={() => {
            setIsEditingInput(true);
            setDraft(current);
          }}
          onChange={(e) =>
            setDraft(toDraftHexInput(e.target.value))
          }
          onBlur={() => {
            const normalized = toValidHex(draft);
            if (normalized) onChange(normalized);
            setDraft(normalized ?? current);
            setIsEditingInput(false);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full border-none bg-transparent text-base font-medium text-ink outline-none placeholder:text-ink-tertiary",
          )}
          aria-invalid={isEditingInput ? !toValidHex(draft) : false}
          {...aria}
        />

        {/* Edit (opens popover) */}
        <button
          type="button"
          ref={btnRef}
          onClick={() => !disabled && setOpen((s) => !s)}
          onMouseDown={() => setDraft(current)}
          className={cn(
            "grid place-items-center rounded-lg p-2 outline-none transition hover:bg-surface2/60 focus-visible:ring-2 focus-visible:ring-ring",
            disabled && "pointer-events-none",
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${inputId}-popover`}
          title="Open color picker"
        >
          <PencilSimpleLine size={20} weight="duotone" className="text-ink-secondary" />
        </button>
      </div>

      {/* Popover */}
      {open ? (
        <div
          id={`${inputId}-popover`}
          role="dialog"
          aria-label="Choose color"
          ref={popoverRef}
          className="absolute z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded ring-1 ring-black/5"
                style={{ backgroundColor: draft }}
              />
              <span className="text-sm text-ink-secondary">Preview</span>
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium",
                toValidHex(draft)
                  ? "bg-brand-primary text-ink-inverted hover:bg-brand-primary/90"
                  : "cursor-not-allowed bg-surface2 text-ink-tertiary",
              )}
              onClick={() => commitHex(draft)}
              disabled={!toValidHex(draft)}
              title="Use this color"
            >
              <Check size={16} /> Apply
            </button>
          </div>

          {/* Quick palette */}
          <div className="mb-4 grid grid-cols-6 gap-2">
            {COLOR_FIELD_PRESET_HEXES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setDraft(c.toUpperCase());
                  commitHex(c);
                }}
                className="h-8 w-8 rounded-lg ring-1 ring-black/5 hover:ring-2 hover:ring-ring"
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
              onChange={(e) => setDraft(toDraftHexInput(e.target.value))}
              maxLength={7}
              className={cn(
                "flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 font-mono text-sm text-ink outline-none",
                toValidHex(draft)
                  ? "focus:ring-2 focus:ring-ring/40"
                  : "ring-2 ring-status-error/20",
              )}
              placeholder="#RRGGBB"
              aria-label="Hex value"
            />
            <button
              type="button"
              onClick={triggerNativePicker}
              className="flex-none rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-ink-secondary hover:bg-surface2/80"
              title="Advanced picker"
            >
              <Palette size={20} className="text-ink-secondary" />
            </button>
            {/* Hidden native input to get OS color dialog when needed */}
            <input
              ref={nativeRef}
              type="color"
              value={toValidHex(draft) ?? current}
              onChange={(e) => setDraft(e.target.value.toUpperCase())}
              onBlur={() => {
                const normalized = toValidHex(draft);
                if (normalized) commitHex(normalized);
              }}
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
