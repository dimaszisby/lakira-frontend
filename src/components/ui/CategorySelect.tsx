"use client";

import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxPopover,
  useComboboxStore,
} from "@ariakit/react";
import { X } from "phosphor-react";
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useCreateMetricCategory } from "@/features/metric-categories/hooks";
import { useCategoryTypeahead } from "@/features/metric-categories/useCategoryTypehead";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/src/lib/cn";

type A11yProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "onBlur" | "autoFocus" | "aria-invalid" | "aria-describedby" | "aria-errormessage"
>;

type SelectedPreviewMode = "minimal" | "full";

type Props = {
  catId: string | null;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedOptionHint?: Partial<MetricCategoryVM> | null;
  className?: string;
  clearable?: boolean;

  // How the selected value looks inside the field when query is empty. Default "minimal"
  selectedPreview?: SelectedPreviewMode;
} & A11yProps;

const CategorySelect = forwardRef<HTMLInputElement, Props>(function CategorySelect(
  {
    catId,
    onChange,
    placeholder = "Search category…",
    disabled,
    selectedOptionHint,
    className,
    selectedPreview = "minimal",
    clearable = true,
    id: injectedId,
    name,
    autoFocus,
    onBlur: injectedOnBlur,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
  },
  forwardedRef,
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const {
    items: options,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useCategoryTypeahead(query);

  const selected = useMemo(() => {
    if (!catId) return null;

    const hit = options.find((o) => o.id === catId);
    if (hit) {
      return {
        id: hit.id,
        name: hit.name,
        color: hit.color,
        icon: hit.icon,
        metricCount: hit.metricCount ?? 0,
      };
    }

    const hint = selectedOptionHint;
    if (hint?.id === catId && hint?.name) {
      return {
        id: hint.id!,
        name: hint.name!,
        color: hint.color ?? "#EDEDED",
        icon: hint.icon ?? "📁",
        metricCount: typeof hint.metricCount === "number" ? hint.metricCount : 0,
      };
    }

    return null; // show placeholder until options contain the item
  }, [catId, options, selectedOptionHint]);

  const store = useComboboxStore({ value: query, setValue: setQuery, open, setOpen });

  const fallbackId = useId();
  const inputId = injectedId ?? fallbackId;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // infinite scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (hasNextPage && el.scrollTop + el.clientHeight >= el.scrollHeight - 96) {
        void fetchNextPage();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNextPage, fetchNextPage]);

  // create
  const { createMetricCategory, isPending: isCreating } = useCreateMetricCategory();
  const createNew = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const created = await createMetricCategory({ name: trimmed, color: "#E897A3", icon: "📁" });
      onChange(created.id);
      setQuery("");
      store.setOpen(false);
      inputRef.current?.focus();
    },
    [createMetricCategory, onChange, store],
  );

  const canCreate = useMemo(() => {
    const t = query.trim();
    return t.length >= 2 && !options.some((o) => o.name.toLowerCase() === t.toLowerCase());
  }, [options, query]);

  const isInvalid = Boolean(ariaInvalid);

  const clear = () => {
    onChange(undefined);
    setQuery("");
    store.setOpen(false);
    inputRef.current?.focus();
  };

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef && "current" in forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [forwardedRef],
  );

  // inside CategorySelect render
  const showSelectedPreview = !!selected && !query && !open;

  return (
    <div className={cn("w-full", className)}>
      {/* Chrome */}
      <div
        className={cn(
          "flex items-center rounded-2xl border px-4 py-3 shadow-sm bg-white border-gray-200",
          "focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-200",
          isInvalid && "border-red-300 ring-2 ring-red-100",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="relative w-full">
          {showSelectedPreview ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center gap-3 px-[2px]",
                "text-gray-600",
              )}
            >
              <span className="text-gray-500">{selected.icon}</span>
              <span
                className="inline-block h-3 w-3 rounded-[3px]"
                style={{ backgroundColor: selected.color }}
              />
              <span className="min-w-0 flex-1 truncate">{selected.name}</span>
              {selectedPreview === "full" ? (
                <span className="ml-2 shrink-0 text-xs tabular-nums text-gray-400">
                  {selected.metricCount}
                </span>
              ) : null}
            </div>
          ) : null}

          <Combobox
            id={inputId}
            ref={setRefs}
            name={name}
            store={store}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={showSelectedPreview ? "" : placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-autocomplete="list"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-errormessage={ariaErrorMessage}
            className="relative z-10 w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setOpen(true);
              if (e.key === "Escape") setOpen(false);
            }}
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && popoverRef.current?.contains(next)) return;
              setOpen(false);
              injectedOnBlur?.(e);
            }}
          />
        </div>

        {clearable && selected ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()} // keep focus: don't trigger blur handlers
            onClick={clear}
            className="ml-2 aspect-square items-center rounded-md p-1 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-400"
            title="Clear"
            aria-label="Clear selected category"
          >
            <X size={12} className="text-violet-600" />
          </button>
        ) : null}
      </div>

      {/* Popover */}
      <ComboboxPopover
        ref={popoverRef}
        store={store}
        gutter={8}
        sameWidth
        className="z-50 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-lg"
      >
        <ComboboxList ref={listRef} className="max-h-64 overflow-auto py-1">
          {isLoading ? <div className="px-4 py-2 text-sm text-gray-500">Loading…</div> : null}

          {!isLoading &&
            options.map((opt) => {
              const active = opt.id === selected?.id;
              return (
                <ComboboxItem
                  key={opt.id}
                  value={opt.name}
                  setValueOnClick={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt.id);
                    setQuery("");
                    store.setOpen(false);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-50",
                    active && "bg-violet-50",
                  )}
                >
                  <span className="text-gray-500">{opt.icon}</span>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-900">{opt.name}</span>
                  <span className="ml-2 shrink-0 text-xs tabular-nums text-gray-500">
                    {opt.metricCount}
                  </span>
                </ComboboxItem>
              );
            })}

          {!isLoading && options.length === 0 && !canCreate && (
            <div className="px-4 py-2 text-sm text-gray-500">No categories found</div>
          )}

          {canCreate ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t px-4 py-2 text-left text-violet-700 hover:bg-violet-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void createNew(query)}
              disabled={isCreating}
            >
              {isCreating ? "Creating…" : `Create "${query.trim()}"`}
            </button>
          ) : null}

          {isFetching && !isLoading ? (
            <div className="px-4 py-2 text-xs text-gray-400">Loading more…</div>
          ) : null}
        </ComboboxList>
      </ComboboxPopover>
    </div>
  );
});

export default CategorySelect;
