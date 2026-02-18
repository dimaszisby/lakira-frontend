import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type SortOrder = "ASC" | "DESC" | null;

type SortChipProps = {
  label: string;
  sortOrder: SortOrder;
  onClick: () => void;
  customChildren?: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

const SortChip = ({
  label,
  sortOrder,
  onClick,
  customChildren,
  className,
  disabled = false,
  ariaLabel,
}: SortChipProps) => {
  const isActive = sortOrder !== null;
  const directionText = sortOrder === "ASC" ? "ascending" : "descending";
  const computedAriaLabel =
    ariaLabel ?? (isActive ? `${label} sorted ${directionText}` : `${label} not sorted`);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={computedAriaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-border px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isActive
          ? "bg-surface text-brand-primary shadow-sm"
          : "bg-surface2 text-ink-secondary hover:bg-surface hover:text-ink",
        className,
      )}
    >
      {customChildren ? (
        customChildren
      ) : (
        <>
          <span>{label}</span>
          {sortOrder ? <span className="text-xs">{sortOrder === "ASC" ? "▲" : "▼"}</span> : null}
        </>
      )}
    </button>
  );
};

export default SortChip;
