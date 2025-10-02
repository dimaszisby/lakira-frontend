import React from "react";

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
}

const SortChipGroup = <T,>({
  sortBy,
  sortOrder,
  onSort,
  className = "",
  columns,
}: SortChipGroupProps<T>) => {
  return (
    <div className={`flex flex-wrap items-start ${className}`}>
      {columns.map((col) => {
        const isSorted = sortBy === col.key;

        return (
          <div
            key={String(col.key)}
            aria-sort={
              col.sortable && isSorted
                ? sortOrder === "ASC"
                  ? "ascending"
                  : "descending"
                : undefined
            }
            className="font-medium"
          >
            {col.sortable && onSort ? (
              <SortChip
                label={col.label}
                sortOrder={isSorted ? sortOrder : null}
                onClick={() => onSort(col.key)}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default SortChipGroup;
