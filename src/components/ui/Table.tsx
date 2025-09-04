import { memo } from "react";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  responsiveWidth?: { sm?: string; md?: string; lg?: string; xl?: string };
  sortable?: boolean;
  renderHeader?: (
    sorted: boolean,
    order: "ASC" | "DESC" | null
  ) => React.ReactNode;
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

const getResponsiveWidthClass = <T,>(
  width?: string,
  responsiveWidth?: TableColumn<T>["responsiveWidth"]
) => {
  const classes: string[] = [];
  if (width) classes.push(width);
  if (responsiveWidth?.sm) classes.push(`sm:${responsiveWidth.sm}`);
  if (responsiveWidth?.md) classes.push(`md:${responsiveWidth.md}`);
  if (responsiveWidth?.lg) classes.push(`lg:${responsiveWidth.lg}`);
  if (responsiveWidth?.xl) classes.push(`xl:${responsiveWidth.xl}`);
  return classes.join(" ");
};

// util: prevent row-click from firing when clicking controls inside the row
function isInteractive(el: HTMLElement) {
  const tag = el.tagName.toLowerCase();
  return (
    tag === "button" ||
    tag === "a" ||
    tag === "input" ||
    tag === "select" ||
    tag === "textarea" ||
    el.getAttribute("role") === "button" ||
    el.getAttribute("role") === "link"
  );
}

export const Table = <T,>({
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
    <div
      className={`hidden sm:block overflow-x-auto rounded-xl shadow-sm bg-white text-sm text-gray-700 ${className}`}
    >
      <table className="min-w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => {
              // Computed Values
              const isSorted = sortBy === col.key;
              const widthClasses = getResponsiveWidthClass<T>(
                col.width,
                col.responsiveWidth
              );

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
                  className={`${widthClasses} px-4 py-3 font-medium ${getAlignClass(
                    col.align
                  )}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="w-full text-inherit focus:outline-none hover:underline"
                    >
                      {col.renderHeader ? (
                        col.renderHeader(isSorted, sortOrder || null)
                      ) : (
                        <>
                          {col.label}
                          {isSorted && (
                            <span className="ml-1 text-xs">
                              {sortOrder === "ASC" ? "▲" : "▼"}
                            </span>
                          )}
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
        <tbody className="bg-gray-50 divide-y divide-gray-200 space-y-2">
          {data.length > 0 ? (
            data.map((item) =>
              renderRow ? (
                renderRow(item)
              ) : (
                <tr
                  key={rowKey(item)}
                  // only look clickable if handler exists
                  className={`transition-colors hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  // mouse
                  onClick={(e) => {
                    if (!onRowClick) return;
                    const target = e.target as HTMLElement;
                    // ignore clicks from interactive descendants
                    if (
                      isInteractive(target) ||
                      target.closest(
                        "button,a,input,select,textarea,[role=button],[role=link]"
                      )
                    ) {
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
                    // Computed Valus
                    const widthClasses = getResponsiveWidthClass(
                      col.width,
                      col.responsiveWidth
                    );
                    const value = item[col.key as keyof T];

                    return (
                      <td
                        key={String(col.key)}
                        className={`${widthClasses} px-4 py-2 ${getAlignClass(
                          col.align
                        )}`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            isInteractive(target) ||
                            target.closest(
                              "button,a,input,select,textarea,[role=button],[role=link]"
                            )
                          ) {
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
              )
            )
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.displayName = "Table";

// Memoized version for programmatic use (not for generic JSX)
export const MemoizedTable = memo(Table) as typeof Table;
export default MemoizedTable;
