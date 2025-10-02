"use client";

import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxPopover,
  useComboboxStore,
} from "@ariakit/react";
import clsx from "clsx";
import * as React from "react";

import { useCreateMetricCategory } from "@/src/features/metric-categories/hooks";
import type { CategoryOption } from "@/src/features/metric-categories/useCategoryTypehead";
import { useCategoryTypeahead } from "@/src/features/metric-categories/useCategoryTypehead";

type Props = {
  value?: string; // categoryId
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedOptionHint?: Partial<CategoryOption>;
  label?: string;
};

const CategorySelect = ({
  value,
  onChange,
  placeholder = "Search category…",
  disabled,
  selectedOptionHint,
  label = "Category",
}: Props) => {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // Fully controlled store, no auto selection to avoid value churn
  const store = useComboboxStore({
    value: query,
    setValue: setQuery,
    open,
    setOpen,
  });

  const { options, isLoading, isFetching, hasNextPage, fetchNextPage } =
    useCategoryTypeahead(query);

  const selected =
    options.find((o) => o.value === value) ??
    (value && selectedOptionHint?.label
      ? {
          value,
          label: selectedOptionHint.label,
          color: selectedOptionHint.color ?? "#EDEDED",
          icon: selectedOptionHint.icon ?? "📁",
          metricCount: selectedOptionHint.metricCount ?? 0,
        }
      : undefined);

  const { createMetricCategory, isPending: isCreating } = useCreateMetricCategory();

  const createNew = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await createMetricCategory({
      name: trimmed,
      color: "#E897A3",
      icon: "📁",
    });
    onChange(created.id);
    setQuery(""); // reset input
    store.setOpen(false); // close popover
  };

  const showCreate =
    query.trim().length >= 2 &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  // Keep popover DOM ref to test blur target
  const popoverRef = React.useRef<HTMLDivElement | null>(null);

  // Infinite scroll in the popover
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
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

  // If the external selection changes (rehydrate), keep search box empty
  React.useEffect(() => {
    setQuery("");
  }, [value]);

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm text-gray-600">{label}</label>

      {/* Input is always controlled by "query" */}
      <Combobox
        store={store}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={selected?.label ?? placeholder}
        disabled={disabled}
        aria-autocomplete="list"
        className={clsx(
          "w-full rounded-xl border bg-white px-3 py-2 outline-none",
          disabled && "cursor-not-allowed bg-gray-50 text-gray-400",
        )}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setOpen(true);
          if (e.key === "Escape") setOpen(false);
        }}
        // IMPORTANT: don't close when the next focus is inside the popover
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && popoverRef.current?.contains(next)) return;
          setOpen(false);
        }}
      />

      <ComboboxPopover
        ref={popoverRef}
        store={store}
        gutter={8}
        sameWidth
        className="z-50 mt-2 w-full rounded-xl border bg-white shadow-lg"
      >
        <ComboboxList ref={listRef} className="max-h-64 overflow-auto">
          {isLoading ? <div className="px-3 py-2 text-sm text-gray-500">Loading…</div> : null}

          {!isLoading &&
            options.map((opt) => (
              <ComboboxItem
                key={opt.value}
                value={opt.label}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-50 aria-selected:bg-gray-100"
                setValueOnClick={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value); // set categoryId in RHF controller
                  setQuery(""); // leave input empty so it stays searchable
                  store.setOpen(false);
                }}
              >
                <span className="text-lg">{opt.icon}</span>
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: opt.color }}
                />
                <span className="flex-1 truncate">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.metricCount}</span>
              </ComboboxItem>
            ))}

          {!isLoading && options.length === 0 && !showCreate && (
            <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
          )}

          {showCreate ? (
            <button
              type="button"
              className="w-full border-t bg-white px-3 py-2 text-left hover:bg-gray-50"
              onMouseDown={(e) => e.preventDefault()} // same blur guard
              onClick={() => void createNew(query)}
              disabled={isCreating}
            >
              {isCreating ? "Creating…" : `Create "${query.trim()}"`}
            </button>
          ) : null}

          {isFetching && !isLoading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Loading more…</div>
          ) : null}
        </ComboboxList>
      </ComboboxPopover>

      {!!value && (
        <button
          type="button"
          className="mt-1 text-xs text-gray-500 hover:text-gray-700"
          onClick={() => {
            onChange(undefined);
            setQuery(""); // also clear the input
            store.setOpen(false); // and close popover
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};
export default CategorySelect;
