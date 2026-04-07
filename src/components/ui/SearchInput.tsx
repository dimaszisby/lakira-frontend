import type { ChangeEvent } from "react";
import type { KeyboardEvent } from "react";
import { forwardRef, memo, useCallback, useId, useRef } from "react";

import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  ariaLabel?: string;
  onClear?: () => void;
  disabled?: boolean;
  /** Optional id for aria-controls if you render a results list elsewhere */
  ariaControlsId?: string;
  /** Optional description id to improve a11y instructions */
  ariaDescribedById?: string;
  /** data-testid passthrough for tests */
  "data-testid"?: string;
};

export const SearchInputBase = forwardRef<HTMLInputElement, Props>(function SearchInput(
  {
    value,
    onChange,
    placeholder = "Search…",
    isLoading = false,
    className = "",
    ariaLabel = "Search",
    onClear,
    disabled = false,
    ariaControlsId,
    ariaDescribedById,
    "data-testid": dataTestId,
  },
  ref,
) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
        return;
      }
      ref.current = node;
    },
    [ref],
  );

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  const clear = useCallback(() => {
    if (disabled) return;
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [disabled, onClear, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.preventDefault();
        clear();
      }
    },
    [value, clear],
  );

  // Reserve space for trailing controls so content never overlaps spinner/clear button.
  const inputPaddingRight = isLoading && value ? "pr-20" : isLoading || value ? "pr-12" : "pr-4";

  return (
    <div className={cn("relative w-full sm:max-w-md", className)}>
      <label htmlFor={id} className="sr-only">
        {ariaLabel}
      </label>

      <input
        id={id}
        ref={setInputRef}
        type="search"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        aria-controls={ariaControlsId}
        aria-describedby={ariaDescribedById}
        data-testid={dataTestId}
        className={cn(
          "w-full rounded-xl border border-border px-4 py-2",
          inputPaddingRight,
          "bg-surface text-ink outline-none ring-0",
          "placeholder:text-ink-tertiary",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      />

      {/* Loading spinner */}
      {isLoading ? (
        <div
          className="absolute right-10 top-1/2 -translate-y-1/2"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
          <span className="sr-only">Loading</span>
        </div>
      ) : null}

      {/* Clear button */}
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          title="Clear"
          onClick={clear}
          disabled={disabled}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2",
            "rounded-xl h-8 w-8 flex items-center justify-center",
            "text-ink-secondary hover:bg-surface2 hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-60",
          )}
        >
          <span aria-hidden>X</span>
        </button>
      ) : null}
    </div>
  );
});
SearchInputBase.displayName = "SearchInput";

const SearchInput = memo(SearchInputBase);
SearchInput.displayName = "SearchInput";
export default SearchInput;
