import React from "react";

import { cn } from "@/lib/cn";

import SortChip from "./SortChip";

export interface SortChipsColumns<T> {
  key: keyof T;
  label: string;
  sortable: boolean;
  renderHeader?: (isSorted: boolean, sortOrder: "ASC" | "DESC" | null) => React.ReactNode;
}

interface SortChipGroupProps<T> {
  columns: SortChipsColumns<T>[];
  sortBy: keyof T;
  sortOrder: "ASC" | "DESC" | null;
  onSort: (column: keyof T) => void;
  className?: string;
  ariaLabel?: string;
}

const SortChipGroup = <T,>({
  sortBy,
  sortOrder,
  onSort,
  className = "",
  ariaLabel = "Sort options",
  columns,
}: SortChipGroupProps<T>) => {
  const fadeMaskStyle: React.CSSProperties = {
    maskImage:
      "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
    WebkitMaskImage:
      "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
    WebkitOverflowScrolling: "touch",
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-full items-start gap-2 overflow-x-auto whitespace-nowrap px-1 snap-x snap-mandatory touch-pan-x",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
      style={fadeMaskStyle}
    >
      {columns.map((col) => {
        const isSorted = sortBy === col.key;

        return (
          <div
            key={String(col.key)}
            data-sort-column={String(col.key)}
            aria-sort={
              col.sortable && isSorted
                ? sortOrder === "ASC"
                  ? "ascending"
                  : "descending"
                : undefined
            }
            className="flex-shrink-0 snap-start font-medium"
          >
            {col.sortable && onSort ? (
              <SortChip
                label={col.label}
                sortOrder={isSorted ? sortOrder : null}
                onClick={() => onSort(col.key)}
                ariaLabel={`Sort by ${col.label}`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default SortChipGroup;
