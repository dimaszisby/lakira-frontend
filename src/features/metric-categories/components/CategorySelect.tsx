"use client";

import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxPopover,
  useComboboxStore,
} from "@ariakit/react";
import { Plus, X } from "phosphor-react";
import type { ComponentProps, CSSProperties, Ref } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { CATEGORY_DEFAULTS } from "@/features/metric-categories/constants";
import { useCreateMetricCategory } from "@/features/metric-categories/hooks";
import { useCategoryTypeahead } from "@/features/metric-categories/useCategoryTypehead";
import type { MetricCategoryVM } from "@/features/metric-categories/view-models";
import { cn } from "@/lib/cn";
import { composeRefs } from "@/lib/compose-refs";

type FieldProps = Pick<
  ComponentProps<"input">,
  "id" | "name" | "onBlur" | "autoFocus" | "aria-invalid" | "aria-describedby" | "aria-errormessage"
>;

export type CategorySelectProps = FieldProps & {
  ref?: Ref<HTMLInputElement>;
  catId: string | null;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Shown for the selected id until the typeahead results contain it. */
  selectedOptionHint?: Partial<MetricCategoryVM> | null;
  className?: string;
  clearable?: boolean;
  /** How the selected category shows inside the field while the query is empty. */
  selectedPreview?: "minimal" | "full";
};

type SelectedCategory = {
  id: string;
  name: string;
  color: string;
  icon: string;
  metricCount: number;
};

const LOAD_MORE_THRESHOLD_PX = 96;
const MIN_CREATE_LENGTH = 2;

/** The category colour is user data, so it reaches the recipe as a custom property. */
const swatchStyle = (color: string) => ({ "--swatch": color }) as CSSProperties;

const resolveSelected = (
  catId: string | null,
  options: MetricCategoryVM[],
  hint: Partial<MetricCategoryVM> | null | undefined,
): SelectedCategory | null => {
  if (!catId) return null;

  const hit = options.find((option) => option.id === catId);
  if (hit) {
    return {
      id: hit.id,
      name: hit.name,
      color: hit.color,
      icon: hit.icon,
      metricCount: hit.metricCount ?? 0,
    };
  }

  if (hint?.id === catId && hint.name) {
    return {
      id: hint.id,
      name: hint.name,
      color: hint.color ?? CATEGORY_DEFAULTS.color,
      icon: hint.icon ?? CATEGORY_DEFAULTS.icon,
      metricCount: typeof hint.metricCount === "number" ? hint.metricCount : 0,
    };
  }

  return null;
};

const CategorySelect = ({
  ref,
  catId,
  onChange,
  placeholder = "Search category…",
  disabled = false,
  selectedOptionHint,
  className,
  selectedPreview = "minimal",
  clearable = true,
  id,
  name,
  autoFocus,
  onBlur,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-errormessage": ariaErrorMessage,
}: CategorySelectProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const fallbackId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    items: options,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useCategoryTypeahead(query);
  const { createMetricCategory, isPending: isCreating } = useCreateMetricCategory();
  const store = useComboboxStore({ value: query, setValue: setQuery, open, setOpen });

  const selected = resolveSelected(catId, options, selectedOptionHint);
  const trimmedQuery = query.trim();
  const canCreate =
    trimmedQuery.length >= MIN_CREATE_LENGTH &&
    !options.some((option) => option.name.toLowerCase() === trimmedQuery.toLowerCase());
  const showSelectedPreview = selected !== null && !query && !open;

  // Load the next page when the list is scrolled near its end.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const handleScroll = () => {
      const distanceToEnd = list.scrollHeight - list.scrollTop - list.clientHeight;
      if (hasNextPage && distanceToEnd <= LOAD_MORE_THRESHOLD_PX) void fetchNextPage();
    };
    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, fetchNextPage]);

  const finishSelection = (nextId: string | undefined) => {
    onChange(nextId);
    setQuery("");
    store.setOpen(false);
    inputRef.current?.focus();
  };

  const createCategory = async () => {
    if (!trimmedQuery) return;
    const created = await createMetricCategory({
      name: trimmedQuery,
      color: CATEGORY_DEFAULTS.color,
      icon: CATEGORY_DEFAULTS.icon,
    });
    finishSelection(created.id);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className="input-shell"
        data-size="md"
        data-invalid={ariaInvalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
      >
        <div className="input-body category-select-field">
          {showSelectedPreview ? (
            <div aria-hidden="true" className="category-select-preview">
              <span>{selected.icon}</span>
              <span className="color-swatch" data-size="xs" style={swatchStyle(selected.color)} />
              <span className="truncate">{selected.name}</span>
              {selectedPreview === "full" ? (
                <span className="category-select-count">{selected.metricCount}</span>
              ) : null}
            </div>
          ) : null}

          <Combobox
            id={id ?? fallbackId}
            ref={composeRefs(inputRef, ref)}
            name={name}
            store={store}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={showSelectedPreview ? "" : placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-autocomplete="list"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-errormessage={ariaErrorMessage}
            aria-busy={isLoading || isFetching || isCreating || undefined}
            className="input-control category-select-input"
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") setOpen(true);
              if (event.key === "Escape") setOpen(false);
            }}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (next && popoverRef.current?.contains(next)) return;
              setOpen(false);
              onBlur?.(event);
            }}
          />
        </div>

        {clearable && selected ? (
          <button
            type="button"
            className="input-icon-button"
            // Keep focus in the input so its blur handling does not close the list.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => finishSelection(undefined)}
            title="Clear"
            aria-label="Clear selected category"
          >
            <X aria-hidden />
          </button>
        ) : null}
      </div>

      <ComboboxPopover ref={popoverRef} store={store} gutter={8} sameWidth className="popover p-0">
        <ComboboxList ref={listRef} className="listbox">
          {isLoading ? <div className="listbox-empty">Loading…</div> : null}

          {isLoading
            ? null
            : options.map((option) => (
                <ComboboxItem
                  key={option.id}
                  value={option.name}
                  setValueOnClick={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => finishSelection(option.id)}
                  data-selected={option.id === selected?.id ? "" : undefined}
                  className="listbox-item"
                >
                  <span>{option.icon}</span>
                  <span className="color-swatch" data-size="xs" style={swatchStyle(option.color)} />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span className="category-select-count">{option.metricCount}</span>
                </ComboboxItem>
              ))}

          {!isLoading && options.length === 0 && !canCreate ? (
            <div className="listbox-empty">No categories found</div>
          ) : null}

          {canCreate ? (
            <button
              type="button"
              className="listbox-item category-select-create"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void createCategory()}
              disabled={isCreating}
            >
              <Plus aria-hidden />
              {isCreating ? "Creating…" : `Create "${trimmedQuery}"`}
            </button>
          ) : null}

          {isFetching && !isLoading ? <div className="listbox-empty">Loading more…</div> : null}
        </ComboboxList>
      </ComboboxPopover>
    </div>
  );
};

export default CategorySelect;
