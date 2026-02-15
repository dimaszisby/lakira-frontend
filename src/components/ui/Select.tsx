"use client";

import { CaretDown } from "phosphor-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Value = string | number;

export type SelectOption<T extends Value = string> = {
  value: T;
  label: string;
  left?: ReactNode;
  disabled?: boolean;
};

export type SelectProps<T extends Value = string> = {
  id?: string;
  value: T | null;
  onChange: (next: T | null, option?: SelectOption<T> | null) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  size?: Size;
  className?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  renderOption?: (
    option: SelectOption<T>,
    state: { active: boolean; selected: boolean },
  ) => ReactNode;
  "aria-label"?: string;
  name?: string;
};

const SIZING: Record<
  Size,
  { shell: string; text: string; menu: string; item: string; chevron: number }
> = {
  sm: {
    shell: "h-10 rounded-xl px-3",
    text: "text-sm",
    menu: "mt-2 rounded-xl py-1",
    item: "px-3 py-2 text-sm",
    chevron: 14,
  },
  md: {
    shell: "h-12 rounded-2xl px-4",
    text: "text-base",
    menu: "mt-2 rounded-2xl py-2",
    item: "px-3.5 py-2.5 text-base",
    chevron: 16,
  },
  lg: {
    shell: "h-14 rounded-2xl px-5",
    text: "text-lg",
    menu: "mt-2 rounded-2xl py-2",
    item: "px-4 py-3 text-lg",
    chevron: 18,
  },
};

function findFirstEnabledIndex<T extends Value>(options: SelectOption<T>[]) {
  return options.findIndex((option) => !option.disabled);
}

function findLastEnabledIndex<T extends Value>(options: SelectOption<T>[]) {
  for (let i = options.length - 1; i >= 0; i--) {
    if (!options[i]?.disabled) return i;
  }
  return -1;
}

function getNextEnabledIndex<T extends Value>(
  options: SelectOption<T>[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;
  let nextIndex = currentIndex;
  for (let i = 0; i < options.length; i++) {
    nextIndex = (nextIndex + direction + options.length) % options.length;
    if (!options[nextIndex]?.disabled) return nextIndex;
  }
  return -1;
}

const Select = <T extends Value = string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  size = "md",
  className,
  leftAddon,
  rightAddon,
  renderOption,
  name,
  ...aria
}: SelectProps<T>) => {
  const uid = useId();
  const triggerId = id ?? `select-${uid}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sizing = SIZING[size];

  const selected = useMemo(() => {
    const index = options.findIndex((option) => option.value === value);
    return {
      index,
      option: index >= 0 ? options[index] : null,
    };
  }, [options, value]);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(selected.index >= 0 ? selected.index : findFirstEnabledIndex(options));
  }, [disabled, options, selected.index]);

  const closeList = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value, option);
      closeList();
      triggerRef.current?.focus();
    },
    [closeList, onChange, options],
  );

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const optionId = `${listboxId}-opt-${activeIndex}`;
    const element = document.getElementById(optionId);
    if (
      element &&
      listRef.current?.contains(element) &&
      typeof (element as HTMLElement).scrollIntoView === "function"
    ) {
      element.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, listboxId, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) return;
      closeList();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeList, open]);

  const setNextActive = (direction: 1 | -1) => {
    const fallback = selected.index >= 0 ? selected.index : findFirstEnabledIndex(options);
    const baseIndex = activeIndex >= 0 ? activeIndex : fallback;
    const nextIndex = getNextEnabledIndex(options, baseIndex, direction);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  };

  const label = selected.option?.label ?? placeholder;
  const isPlaceholder = selected.option == null;

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
      onBlurCapture={(event) => {
        if (!open) return;
        const nextFocused = event.relatedTarget as Node | null;
        if (nextFocused && wrapperRef.current?.contains(nextFocused)) return;
        closeList();
      }}
    >
      <button
        id={triggerId}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-disabled={disabled || undefined}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={(event) => {
          if (disabled) return;

          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!open) openList();
            else setNextActive(1);
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openList();
            else setNextActive(-1);
            return;
          }

          if (event.key === "Home" && open) {
            event.preventDefault();
            setActiveIndex(findFirstEnabledIndex(options));
            return;
          }

          if (event.key === "End" && open) {
            event.preventDefault();
            setActiveIndex(findLastEnabledIndex(options));
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open && activeIndex >= 0) commit(activeIndex);
            else openList();
            return;
          }

          if (event.key === "Escape" && open) {
            event.preventDefault();
            closeList();
            return;
          }

          if (event.key === "Tab" && open) closeList();
        }}
        className={cn(
          "flex w-full items-center justify-between border border-border bg-surface shadow-sm transition-colors",
          "hover:bg-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          sizing.shell,
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
        {...aria}
      >
        <span className="flex min-w-0 items-center gap-3">
          {leftAddon ? (
            <span aria-hidden className="text-ink-secondary">
              {leftAddon}
            </span>
          ) : null}
          <span
            className={cn(
              "truncate font-medium",
              sizing.text,
              isPlaceholder ? "text-ink-tertiary" : "text-ink",
            )}
          >
            {label}
          </span>
        </span>

        <span className="ml-3 flex items-center gap-2">
          {rightAddon ? <span className="text-ink-tertiary">{rightAddon}</span> : null}
          <CaretDown
            size={sizing.chevron}
            className={cn(
              "text-ink-secondary transition-transform",
              open ? "rotate-180" : "rotate-0",
            )}
          />
        </span>
      </button>

      {open ? (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-labelledby={triggerId}
          className={cn(
            "absolute left-0 right-0 top-full z-50 max-h-60 overflow-auto border border-border bg-surface shadow-lg",
            sizing.menu,
          )}
        >
          {options.length === 0 ? (
            <li role="presentation" className="px-3 py-3 text-sm text-ink-tertiary">
              No options
            </li>
          ) : (
            options.map((option, index) => {
              const active = index === activeIndex;
              const isSelected = value === option.value;
              return (
                <li
                  key={`${String(option.value)}-${index}`}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  tabIndex={-1}
                  className={cn(
                    "flex items-center gap-3",
                    sizing.item,
                    active ? "bg-surface2" : "",
                    option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  )}
                  onMouseEnter={() => {
                    if (!option.disabled) setActiveIndex(index);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    if (!option.disabled) commit(index);
                  }}
                >
                  {renderOption ? (
                    renderOption(option, { active, selected: isSelected })
                  ) : (
                    <>
                      {option.left ? <span className="text-ink-secondary">{option.left}</span> : null}
                      <span className={cn(isSelected ? "text-brand-primary" : "text-ink")}>
                        {option.label}
                      </span>
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {name ? <input type="hidden" name={name} value={value == null ? "" : String(value)} /> : null}
    </div>
  );
};

export default Select;
