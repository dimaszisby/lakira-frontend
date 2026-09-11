import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type PaginationProps = {
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  /** With a known total the pager shows numbered pages; without one it runs in cursor mode. */
  total?: number;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
  "aria-label"?: string;
};

type PageItem = number | "ellipsis-start" | "ellipsis-end";

const RANGE_AROUND_CURRENT = 2;

const clampPage = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizePositiveInteger = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;

const getPaginationItems = (currentPage: number, totalPages: number): PageItem[] => {
  const items: PageItem[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const isBoundary = pageNumber === 1 || pageNumber === totalPages;
    const isNearCurrent = Math.abs(pageNumber - currentPage) <= RANGE_AROUND_CURRENT;

    if (isBoundary || isNearCurrent) {
      items.push(pageNumber);
    } else if (pageNumber < currentPage && !items.includes("ellipsis-start")) {
      items.push("ellipsis-start");
    } else if (pageNumber > currentPage && !items.includes("ellipsis-end")) {
      items.push("ellipsis-end");
    }
  }

  return items;
};

type PagerButtonProps = ComponentProps<"button"> & { isCurrent?: boolean };

const PagerButton = ({ isCurrent = false, className, ...props }: PagerButtonProps) => (
  <button
    type="button"
    data-current={isCurrent ? "" : undefined}
    aria-current={isCurrent ? "page" : undefined}
    className={cn("pager-button", className)}
    {...props}
  />
);

export const Pagination = ({
  page,
  pageSize,
  onChange,
  total,
  canPrev,
  canNext,
  className,
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) => {
  const totalPages =
    typeof total === "number"
      ? Math.max(1, Math.ceil(Math.max(0, total) / normalizePositiveInteger(pageSize, 1)))
      : null;
  const isKnownTotal = totalPages !== null;
  const currentPage = isKnownTotal
    ? clampPage(Math.max(1, page), 1, totalPages)
    : Math.max(1, page);

  // With a known total the page bounds always apply; in cursor mode the caller decides.
  const cursorPrevDisabled = typeof canPrev === "boolean" ? !canPrev : currentPage <= 1;
  const prevDisabled = isKnownTotal ? currentPage <= 1 || canPrev === false : cursorPrevDisabled;
  const nextDisabled = isKnownTotal
    ? currentPage >= totalPages || canNext === false
    : canNext === false;

  const goToPage = (targetPage: number) => {
    const nextPage = isKnownTotal ? clampPage(targetPage, 1, totalPages) : Math.max(1, targetPage);
    if (nextPage !== currentPage) onChange(nextPage);
  };

  return (
    <nav aria-label={ariaLabel} className={cn("pager", className)}>
      <PagerButton
        aria-label="Previous page"
        disabled={prevDisabled}
        onClick={() => goToPage(currentPage - 1)}
      >
        Prev
      </PagerButton>

      {isKnownTotal ? (
        getPaginationItems(currentPage, totalPages).map((item) =>
          typeof item === "number" ? (
            <PagerButton
              key={item}
              aria-label={`Go to page ${item}`}
              isCurrent={item === currentPage}
              disabled={item === currentPage}
              onClick={() => goToPage(item)}
            >
              {item}
            </PagerButton>
          ) : (
            <span key={item} className="pager-ellipsis" aria-hidden="true">
              ...
            </span>
          ),
        )
      ) : (
        <span className="pager-status" aria-live="polite">
          Page {currentPage}
        </span>
      )}

      <PagerButton
        aria-label="Next page"
        disabled={nextDisabled}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </PagerButton>

      {isKnownTotal ? (
        <span className="sr-only" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
      ) : null}
    </nav>
  );
};
