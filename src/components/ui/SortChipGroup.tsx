import { cn } from "@/lib/cn";

import type { SortOrder } from "./SortChip";
import { SortChip } from "./SortChip";

export type SortChipColumn<T> = {
  key: keyof T;
  label: string;
  sortable: boolean;
};

export type SortChipGroupProps<T> = {
  columns: SortChipColumn<T>[];
  sortBy: keyof T;
  sortOrder: SortOrder;
  onSort: (column: keyof T) => void;
  className?: string;
  "aria-label"?: string;
};

/** A horizontally scrolling row of sort chips, one per sortable column. */
export const SortChipGroup = <T,>({
  columns,
  sortBy,
  sortOrder,
  onSort,
  className,
  "aria-label": ariaLabel = "Sort options",
}: SortChipGroupProps<T>) => (
  <div role="group" aria-label={ariaLabel} className={cn("chip-group", className)}>
    {columns
      .filter((column) => column.sortable)
      .map((column) => (
        <div
          key={String(column.key)}
          data-sort-column={String(column.key)}
          className="chip-group-item"
        >
          <SortChip
            label={column.label}
            sortOrder={sortBy === column.key ? sortOrder : null}
            onClick={() => onSort(column.key)}
            aria-label={`Sort by ${column.label}`}
          />
        </div>
      ))}
  </div>
);
