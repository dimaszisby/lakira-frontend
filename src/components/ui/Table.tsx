import type { ReactNode } from "react";
import { Fragment, memo } from "react";

import { cn } from "@/lib/cn";

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
  renderHeader?: (sorted: boolean, order: "ASC" | "DESC" | null) => ReactNode;
  renderCell?: (row: T, value: T[keyof T]) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortBy?: keyof T;
  sortOrder?: "ASC" | "DESC" | null;
  onSort?: (column: keyof T) => void;
  rowKey: (item: T) => string;
  renderRow?: (item: T) => ReactNode;
  className?: string;
  ariaLabel?: string;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  onRowHover?: (item: T) => void;
}

const INTERACTIVE_ELEMENT_SELECTOR =
  "button,a,input,select,textarea,[role=button],[role=link],[data-stop-row-click=true]";

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

const getHeaderSortState = (
  sortable: boolean | undefined,
  isSorted: boolean,
  sortOrder: "ASC" | "DESC" | null | undefined,
) => {
  if (!sortable || !isSorted) return undefined;
  if (sortOrder === "ASC") return "ascending";
  if (sortOrder === "DESC") return "descending";
  return "none";
};

export const TableBase = <T,>({
  data,
  columns,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  onRowHover,
  rowKey,
  renderRow,
  className = "",
  ariaLabel = "Data table",
  emptyMessage = "No data available",
}: TableProps<T>) => {
  const colSpan = Math.max(1, columns.length);

  return (
    <div
      className={cn(
        "hidden overflow-x-auto rounded-xl border border-border bg-surface text-sm shadow-sm sm:block",
        className,
      )}
    >
      <table className="min-w-full table-fixed border-collapse" aria-label={ariaLabel}>
        <thead className="bg-bg">
          <tr>
            {columns.map((column) => {
              const isSorted = sortBy === column.key;
              const widthClasses = getResponsiveWidthClass(column.width, column.responsiveWidth);
              const ariaSort = getHeaderSortState(column.sortable, isSorted, sortOrder);

              return (
                <th
                  key={String(column.key)}
                  scope="col"
                  aria-sort={ariaSort}
                  className={cn(
                    widthClasses,
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-secondary",
                    getAlignClass(column.align),
                  )}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        "w-full rounded-sm text-inherit hover:underline",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      aria-label={`Sort by ${column.label}`}
                    >
                      {column.renderHeader ? (
                        column.renderHeader(isSorted, sortOrder ?? null)
                      ) : (
                        <>
                          {column.label}
                          {isSorted && sortOrder ? (
                            <span className="ml-1 text-[10px]">{sortOrder === "ASC" ? "▲" : "▼"}</span>
                          ) : null}
                        </>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface2">
          {data.length > 0 ? (
            data.map((item) =>
              renderRow ? (
                <Fragment key={rowKey(item)}>{renderRow(item)}</Fragment>
              ) : (
                <tr
                  key={rowKey(item)}
                  className={cn("transition-colors hover:bg-surface", {
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring":
                      onRowClick,
                  })}
                  onMouseEnter={() => onRowHover?.(item)}
                  onFocus={() => onRowHover?.(item)}
                  onClick={(event) => {
                    if (!onRowClick) return;
                    const target = event.target as HTMLElement;
                    if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) return;
                    onRowClick(item);
                  }}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    const target = event.target as HTMLElement;
                    if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(item);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : -1}
                  data-rowid={rowKey(item)}
                  aria-label={onRowClick ? "View row details" : undefined}
                >
                  {columns.map((column) => {
                    const widthClasses = getResponsiveWidthClass(column.width, column.responsiveWidth);
                    const value = item[column.key as keyof T];

                    return (
                      <td
                        key={String(column.key)}
                        className={cn(widthClasses, "px-4 py-2 text-ink", getAlignClass(column.align))}
                        onClick={(event) => {
                          const target = event.target as HTMLElement;
                          if (target.closest(INTERACTIVE_ELEMENT_SELECTOR)) event.stopPropagation();
                        }}
                      >
                        {column.renderCell
                          ? column.renderCell(item, value)
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
              <td colSpan={colSpan} className="px-4 py-6 text-center text-ink-secondary">
                {emptyMessage}
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
