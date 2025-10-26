// src/components/ui/Select.tsx
"use client";

import clsx from "clsx";
import { CaretDown, CaretUp } from "phosphor-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type Size = "sm" | "md" | "lg";
type V = string | number;

export type SelectOption<T extends V = string> = {
  value: T;
  label: string;
  left?: React.ReactNode; // per-option leading icon/chip (in menu)
  disabled?: boolean;
};

export type SelectProps<T extends V = string> = {
  id?: string;
  value: T | null;
  onChange: (next: T | null, option?: SelectOption<T> | null) => void;
  options: SelectOption<T>[];

  placeholder?: string;
  disabled?: boolean;
  size?: Size;
  className?: string;

  // Slots inside the field (not the menu)
  leftAddon?: React.ReactNode; // e.g., Trend icon (like your screenshot)
  rightAddon?: React.ReactNode; // e.g., an extra icon/button at the far right

  // Customizers
  renderOption?: (
    opt: SelectOption<T>,
    state: { active: boolean; selected: boolean },
  ) => React.ReactNode;

  // a11y
  "aria-label"?: string;
  name?: string; // (optional) to pair with hidden input if needed
};

const SIZING: Record<
  Size,
  { shell: string; text: string; menu: string; item: string; chevron: number }
> = {
  sm: {
    shell: "h-10 px-3 rounded-xl",
    text: "text-sm",
    menu: "mt-2 rounded-xl py-1",
    item: "px-3 py-2 text-sm",
    chevron: 14,
  },
  md: {
    shell: "h-12 px-4 rounded-2xl",
    text: "text-base",
    menu: "mt-2 rounded-2xl py-2",
    item: "px-3.5 py-2.5 text-base",
    chevron: 16,
  },
  lg: {
    shell: "h-14 px-5 rounded-2xl",
    text: "text-lg",
    menu: "mt-2 rounded-2xl py-2",
    item: "px-4 py-3 text-lg",
    chevron: 18,
  },
};

const Select = <T extends V = string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  size = "md",
  className,
  leftAddon,
  rightAddon,
  renderOption,
  name,
  ...aria
}: SelectProps<T>) => {
  const uid = useId();
  const triggerId = id ?? `sel-${uid}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const sizing = SIZING[size];

  const selected = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return { idx, opt: idx >= 0 ? options[idx] : null };
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    // set active to selected (or first enabled)
    if (selected.idx >= 0) setActiveIdx(selected.idx);
    else {
      const first = options.findIndex((o) => !o.disabled);
      setActiveIdx(first);
    }

    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapperRef.current?.contains(t)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, options, selected.idx]);

  useEffect(() => {
    // ensure active item is visible
    if (!open || activeIdx < 0) return;
    const el = document.getElementById(`${listboxId}-opt-${activeIdx}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx, listboxId]);

  const setNext = (dir: 1 | -1) => {
    if (!options.length) return;
    let i = activeIdx;
    for (let step = 0; step < options.length; step++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) {
        setActiveIdx(i);
        break;
      }
    }
  };

  const commit = useCallback(
    (idx: number) => {
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      onChange(opt.value, opt);
      setOpen(false);
    },
    [onChange, options],
  );

  const label = selected.opt?.label ?? placeholder;
  const isPlaceholder = selected.opt == null;

  return (
    <div ref={wrapperRef} className={clsx("relative", className)}>
      {/* Trigger */}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-disabled={disabled || undefined}
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={open && activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined}
        onClick={() => !disabled && setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            setNext(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) setOpen(true);
            setNext(-1);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (open && activeIdx >= 0) commit(activeIdx);
            else setOpen(true);
          }
        }}
        className={clsx(
          "flex w-full items-center justify-between border border-gray-200 bg-white shadow-sm hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400",
          sizing.shell,
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          "transition-colors",
        )}
        {...aria}
      >
        {/* Left side: icon + text */}
        <span className="flex min-w-0 items-center gap-3">
          {leftAddon ? (
            <span aria-hidden className="text-violet-500">
              {leftAddon}
            </span>
          ) : null}
          <span
            className={clsx(
              "truncate font-medium",
              sizing.text,
              isPlaceholder ? "text-gray-400" : "text-violet-600",
            )}
          >
            {label}
          </span>
        </span>

        {/* Right side: (optional addon) + chevrons */}
        <span className="ml-3 flex items-center gap-2">
          {rightAddon ? <span className="text-gray-400">{rightAddon}</span> : null}
          <span className="-gap-y-1 grid">
            <CaretUp size={sizing.chevron} className="text-violet-500" />
            <CaretDown size={sizing.chevron} className="-mt-1 text-violet-500" />
          </span>
        </span>
      </button>

      {/* Listbox */}
      {open ? (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-labelledby={triggerId}
          className={clsx(
            "absolute left-0 right-0 top-full z-50 max-h-60 overflow-auto border border-gray-200 bg-white shadow-lg",
            sizing.menu,
          )}
        >
          {options.length === 0 ? (
            <span className={clsx("px-3 py-3 text-sm text-gray-500")} aria-disabled="true">
              No options
            </span>
          ) : (
            options.map((opt, i) => {
              const active = i === activeIdx;
              const selected = value === opt.value;
              const commonCls = clsx(
                "flex cursor-pointer items-center gap-3",
                sizing.item,
                active ? "bg-violet-50" : "",
                opt.disabled ? "cursor-not-allowed opacity-50" : "",
              );
              return (
                <li
                  key={`${String(opt.value)}-${i}`}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={opt.disabled || undefined}
                  tabIndex={-1}
                  className={commonCls}
                  onMouseEnter={() => !opt.disabled && setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                  onClick={() => !opt.disabled && commit(i)}
                >
                  {renderOption ? (
                    renderOption(opt, { active, selected })
                  ) : (
                    <>
                      {opt.left ? <span className="text-gray-700">{opt.left}</span> : null}
                      <span className={clsx(selected ? "text-violet-700" : "text-gray-800")}>
                        {opt.label}
                      </span>
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {/* Optional hidden input if you want to pair with plain HTML forms */}
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
    </div>
  );
};

export default Select;
