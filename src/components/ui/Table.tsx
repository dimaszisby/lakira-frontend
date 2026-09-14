"use client";

import { CaretDown, CaretUp } from "@phosphor-icons/react";
import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Fragment } from "react";

import type { SortOrder as SortDirection } from "@/generics/sort";
import { cn } from "@/lib/cn";

type SortOrder = SortDirection | null;

export type ResponsiveWidth = {
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
};

export type TableColumn<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  responsiveWidth?: ResponsiveWidth;
  sortable?: boolean;
  renderHeader?: (sorted: boolean, order: SortOrder) => ReactNode;
  renderCell?: (row: T, value: T[keyof T]) => ReactNode;
};

export type TableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];
  rowKey: (item: T) => string;
  sortBy?: keyof T;
  sortOrder?: SortOrder;
  onSort?: (column: keyof T) => void;
  /** Custom row renderer; replaces the default row and its click/hover handling. */
  renderRow?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  onRowHover?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  "aria-label"?: string;
};

/** Clicks and key presses from these elements belong to the element, not the row. */
const INTERACTIVE_ELEMENT_SELECTOR =
  "button,a,input,select,textarea,[role=button],[role=link],[data-stop-row-click=true]";

const isFromInteractiveElement = (event: { target: EventTarget }) =>
  event.target instanceof Element && event.target.closest(INTERACTIVE_ELEMENT_SELECTOR) !== null;

const ALIGN_CLASS = { left: "text-left", center: "text-center", right: "text-right" } as const;

const widthClasses = (width?: string, responsiveWidth?: ResponsiveWidth) =>
  cn(
    width,
    responsiveWidth?.sm && `sm:${responsiveWidth.sm}`,
    responsiveWidth?.md && `md:${responsiveWidth.md}`,
    responsiveWidth?.lg && `lg:${responsiveWidth.lg}`,
    responsiveWidth?.xl && `xl:${responsiveWidth.xl}`,
  );

const ariaSortFor = (sortable: boolean | undefined, isSorted: boolean, sortOrder?: SortOrder) => {
  if (!sortable || !isSorted) return undefined;
  if (sortOrder === "ASC") return "ascending";
  if (sortOrder === "DESC") return "descending";
  return "none";
};

export const Table = <T,>({
  data,
  columns,
  rowKey,
  sortBy,
  sortOrder,
  onSort,
  renderRow,
  onRowClick,
  onRowHover,
  emptyMessage = "No data available",
  className,
  "aria-label": ariaLabel = "Data table",
}: TableProps<T>) => (
  <div className={cn("data-table-wrap", className)}>
    <table className="data-table" aria-label={ariaLabel}>
      <thead>
        <tr>
          {columns.map((column) => {
            const isSorted = sortBy === column.key;
            const SortIcon = sortOrder === "ASC" ? CaretUp : CaretDown;

            return (
              <th
                key={String(column.key)}
                scope="col"
                aria-sort={ariaSortFor(column.sortable, isSorted, sortOrder)}
                className={cn(
                  widthClasses(column.width, column.responsiveWidth),
                  ALIGN_CLASS[column.align ?? "left"],
                )}
              >
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="data-table-sort-button"
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.renderHeader ? (
                      column.renderHeader(isSorted, sortOrder ?? null)
                    ) : (
                      <>
                        {column.label}
                        {isSorted && sortOrder ? <SortIcon weight="bold" aria-hidden /> : null}
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

      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={Math.max(1, columns.length)} className="data-table-empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((item) => {
            const key = rowKey(item);

            if (renderRow) return <Fragment key={key}>{renderRow(item)}</Fragment>;

            return (
              <tr
                key={key}
                data-rowid={key}
                data-interactive={onRowClick ? "" : undefined}
                tabIndex={onRowClick ? 0 : -1}
                aria-label={onRowClick ? "View row details" : undefined}
                className="data-table-row"
                onMouseEnter={() => onRowHover?.(item)}
                onFocus={(event: FocusEvent<HTMLTableRowElement>) => {
                  if (!onRowHover || isFromInteractiveElement(event)) return;
                  onRowHover(item);
                }}
                onClick={(event: MouseEvent<HTMLTableRowElement>) => {
                  if (!onRowClick || isFromInteractiveElement(event)) return;
                  onRowClick(item);
                }}
                onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                  if (!onRowClick || isFromInteractiveElement(event)) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(item);
                  }
                }}
              >
                {columns.map((column) => {
                  const value = item[column.key];

                  return (
                    <td
                      key={String(column.key)}
                      className={cn(
                        widthClasses(column.width, column.responsiveWidth),
                        ALIGN_CLASS[column.align ?? "left"],
                      )}
                    >
                      {column.renderCell
                        ? column.renderCell(item, value)
                        : value === null || value === undefined
                          ? ""
                          : String(value)}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
