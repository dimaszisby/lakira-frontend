import { memo } from "react";

import { cn } from "@/src/lib/cn";

export type ResponsiveWidth = {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
};

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  responsiveWidth?: ResponsiveWidth;
  sortable?: boolean;
  renderHeader?: (sorted: boolean, order: "ASC" | "DESC" | null) => React.ReactNode;
  renderCell?: (row: T, value: T[keyof T]) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortBy?: keyof T;
  sortOrder?: "ASC" | "DESC" | null;
  onSort?: (column: keyof T) => void;
  rowKey: (item: T) => string;
  renderRow?: (item: T) => React.ReactNode;
  className?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void; // Not implemented yet
}

function getAlignClass(align: "left" | "center" | "right" = "left") {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

const getResponsiveWidthClass = (width?: string, responsiveWidth?: ResponsiveWidth) => {
  const classes: string[] = [];
  if (width) classes.push(width);
  if (responsiveWidth?.sm) classes.push(`sm:${responsiveWidth.sm}`);
  if (responsiveWidth?.md) classes.push(`md:${responsiveWidth.md}`);
  if (responsiveWidth?.lg) classes.push(`lg:${responsiveWidth.lg}`);
  if (responsiveWidth?.xl) classes.push(`xl:${responsiveWidth.xl}`);
  return classes.join(" ");
};

// Selector for interactive elements that should prevent row click propagation
const INTERACTIVE_ELEMENT_SELECTOR = "button,a,input,select,textarea,[role=button],[role=link]";

export const TableBase = <T,>({
  data,
  columns,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  rowKey,
  renderRow,
  className = "",
}: TableProps<T>) => {
  return (
    <div className={cn("hidden overflow-x-auto rounded-xl text-sm shadow-sm sm:block", className)}>
      <table className="min-w-full table-fixed divide-y divide-border">
        <thead className={cn("bg-bg")}>
          <tr>
            {columns.map((col) => {
              // Computed values
              const isSorted = sortBy === col.key;
              const widthClasses = getResponsiveWidthClass(col.width, col.responsiveWidth);

              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  aria-sort={
                    col.sortable && isSorted
                      ? sortOrder === "ASC"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={`${widthClasses} px-4 py-3 font-medium ${getAlignClass(col.align)}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="w-full text-inherit hover:underline focus:outline-none"
                    >
                      {col.renderHeader ? (
                        col.renderHeader(isSorted, sortOrder || null)
                      ) : (
                        <>
                          {col.label}
                          {isSorted ? (
                            <span className="ml-1 text-xs">{sortOrder === "ASC" ? "▲" : "▼"}</span>
                          ) : null}
                        </>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={cn("bg-surface2", "space-y-2 divide-y divide-border")}>
          {data.length > 0 ? (
            data.map((item) =>
              renderRow ? (
                renderRow(item)
              ) : (
                <tr
                  key={rowKey(item)}
                  // only look clickable if handler exists
                  className={cn("transition-colors hover:bg-surface", {
                    "cursor-pointer": onRowClick,
                  })}
                  // mouse
                  onClick={(e) => {
                    if (!onRowClick) return;
                    const target = e.target as HTMLElement;
                    // ignore clicks from interactive descendants
                    if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) {
                      return;
                    }
                    onRowClick(item);
                  }}
                  // keyboard accessibility (Enter/Space)
                  tabIndex={onRowClick ? 0 : -1}
                  onKeyDown={(e) => {
                    if (!onRowClick) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  }}
                  // testing hook
                  data-rowid={rowKey(item)}
                  aria-label={onRowClick ? "View row details" : undefined}
                >
                  {columns.map((col) => {
                    // Computed values
                    const widthClasses = getResponsiveWidthClass(col.width, col.responsiveWidth);
                    const value = item[col.key as keyof T];

                    return (
                      <td
                        key={String(col.key)}
                        className={`${widthClasses} px-4 py-2 ${getAlignClass(col.align)}`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {col.renderCell
                          ? col.renderCell(item, value)
                          : value == null
                            ? ""
                            : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ),
            )
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
TableBase.displayName = "Table";

export const Table = memo(TableBase) as typeof TableBase;
Table.displayName = "Table";
export default Table;
