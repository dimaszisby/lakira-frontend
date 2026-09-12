"use client";

import { Popover, PopoverDisclosure, PopoverProvider } from "@ariakit/react";
import { Check, Palette, PencilSimpleLine } from "phosphor-react";
import type { ComponentProps, CSSProperties } from "react";
import { useId, useRef, useState } from "react";

import { COLOR_FIELD_PRESET_HEXES, DEFAULT_COLOR_HEX } from "@/constants/color-presets";

import { Button } from "./Button";
import { InputChrome } from "./InputChrome";
import { TextField } from "./TextField";

export type ColorFieldProps = Pick<
  ComponentProps<"input">,
  "aria-label" | "aria-describedby" | "aria-invalid" | "aria-errormessage"
> & {
  id?: string;
  /** A `#RRGGBB` hex string, or null for "use the default colour". */
  value: string | null;
  onChange: (hex: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultColor?: string;
  /** Applied to the field shell. */
  className?: string;
};

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;
const HEX_SHORT_RE = /^#([0-9A-Fa-f]{3})$/;

const toValidHex = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (HEX_RE.test(trimmed)) return trimmed.toUpperCase();
  if (HEX_SHORT_RE.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
};

const normalizeHex = (input: string | null | undefined, fallback: string) =>
  toValidHex(input) ?? toValidHex(fallback) ?? DEFAULT_COLOR_HEX;

const toDraftHexInput = (rawInput: string) => {
  const raw = rawInput.toUpperCase().replace(/\s/g, "");
  return raw ? `#${raw.replace(/#/g, "")}` : "";
};

/** The swatch colour is user data, so it reaches the recipe as a custom property. */
const swatchStyle = (hex: string) => ({ "--swatch": hex }) as CSSProperties;

export const ColorField = ({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = DEFAULT_COLOR_HEX,
  defaultColor = DEFAULT_COLOR_HEX,
  className,
  "aria-label": ariaLabel,
  ...ariaProps
}: ColorFieldProps) => {
  const fallbackId = useId();
  const inputId = id ?? `color-input-${fallbackId}`;
  const current = normalizeHex(value, defaultColor);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);
  const [isEditing, setIsEditing] = useState(false);
  const nativePickerRef = useRef<HTMLInputElement>(null);
  const draftHex = toValidHex(draft);

  const commitHex = (hex: string) => {
    const normalized = toValidHex(hex);
    if (!normalized) return;
    onChange(normalized);
    setDraft(normalized);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(current);
    setOpen(nextOpen);
  };

  return (
    <PopoverProvider open={open} setOpen={handleOpenChange}>
      {ariaLabel ? null : (
        <label htmlFor={inputId} className="sr-only">
          Color
        </label>
      )}

      <InputChrome
        disabled={disabled}
        className={className}
        leftAddon={
          <span aria-hidden="true" className="color-swatch" style={swatchStyle(current)} />
        }
        rightAddon={
          <PopoverDisclosure
            className="input-icon-button"
            disabled={disabled}
            aria-label="Open color picker"
            title="Open color picker"
          >
            <PencilSimpleLine weight="duotone" aria-hidden />
          </PopoverDisclosure>
        }
      >
        <input
          id={inputId}
          type="text"
          inputMode="text"
          maxLength={7}
          value={isEditing ? draft : current}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={isEditing ? !draftHex : undefined}
          {...ariaProps}
          onFocus={() => {
            setIsEditing(true);
            setDraft(current);
          }}
          onChange={(event) => setDraft(toDraftHexInput(event.target.value))}
          onBlur={() => {
            if (draftHex) onChange(draftHex);
            setDraft(draftHex ?? current);
            setIsEditing(false);
          }}
          className="input-control color-field-input"
        />
      </InputChrome>

      <Popover gutter={8} unmountOnHide aria-label="Choose color" className="popover color-picker">
        <div className="color-picker-header">
          <span className="color-picker-preview">
            <span
              aria-hidden="true"
              className="color-swatch"
              data-size="sm"
              style={swatchStyle(draftHex ?? current)}
            />
            Preview
          </span>
          <Button
            size="sm"
            leftIcon={<Check aria-hidden />}
            disabled={!draftHex}
            onClick={() => commitHex(draft)}
          >
            Apply
          </Button>
        </div>

        <div role="group" aria-label="Preset colors" className="color-presets">
          {COLOR_FIELD_PRESET_HEXES.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={`Choose ${hex}`}
              aria-pressed={draftHex === hex.toUpperCase()}
              className="color-preset"
              style={swatchStyle(hex)}
              onClick={() => commitHex(hex)}
            />
          ))}
        </div>

        <div className="color-picker-editor">
          <TextField
            size="sm"
            aria-label="Hex value"
            value={draft}
            maxLength={7}
            invalid={!draftHex}
            placeholder="#RRGGBB"
            onChange={(event) => setDraft(toDraftHexInput(event.target.value))}
            className="font-mono"
            wrapperClassName="flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Palette aria-hidden />}
            aria-label="Open system color picker"
            onClick={() => nativePickerRef.current?.click()}
          />
          <input
            ref={nativePickerRef}
            type="color"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            value={draftHex ?? current}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            onBlur={() => {
              if (draftHex) commitHex(draftHex);
            }}
          />
        </div>
      </Popover>
    </PopoverProvider>
  );
};
