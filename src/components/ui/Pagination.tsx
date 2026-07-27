import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  total?: number;
  canPrev?: boolean;
  canNext?: boolean;
  className?: string;
  ariaLabel?: string;
};

type PageItem = number | "...";

const RANGE_AROUND_CURRENT = 2;

const pagerButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const pagerButtonEnabledClassName = "hover:bg-surface2";
const pagerButtonCurrentClassName = "border-brand-primary/30 bg-brand-primary/15 text-brand-primary";

export const Pagination = ({
  page,
  total,
  pageSize,
  onChange,
  canPrev,
  canNext,
  className,
  ariaLabel = "Pagination",
}: PaginationProps) => {
  const safePageSize = normalizePositiveInteger(pageSize, 1);
  const totalPages =
    typeof total === "number" ? Math.max(1, Math.ceil(Math.max(0, total) / safePageSize)) : null;

  const currentPage =
    totalPages === null ? Math.max(1, page) : clampPage(Math.max(1, page), 1, totalPages);
  const prevDisabled =
    totalPages === null
      ? typeof canPrev === "boolean"
        ? !canPrev
        : currentPage <= 1
      : currentPage <= 1 || (typeof canPrev === "boolean" ? !canPrev : false);
  const nextDisabled =
    totalPages === null
      ? typeof canNext === "boolean"
        ? !canNext
        : false
      : currentPage >= totalPages || (typeof canNext === "boolean" ? !canNext : false);

  const goToPage = (targetPage: number) => {
    const nextPage =
      totalPages === null ? Math.max(1, targetPage) : clampPage(targetPage, 1, totalPages);
    if (nextPage !== currentPage) onChange(nextPage);
  };

  if (totalPages === null) {
    return (
      <nav className={cn("flex items-center justify-center gap-1", className)} aria-label={ariaLabel}>
        <PagerButton
          label="Prev"
          ariaLabel="Previous page"
          disabled={prevDisabled}
          onClick={() => goToPage(currentPage - 1)}
        />
        <span className="px-3 py-1 text-sm text-ink-secondary" aria-live="polite">
          Page {currentPage}
        </span>
        <PagerButton
          label="Next"
          ariaLabel="Next page"
          disabled={nextDisabled}
          onClick={() => goToPage(currentPage + 1)}
        />
      </nav>
    );
  }

  const pageItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label={ariaLabel}>
      <PagerButton
        label="Prev"
        ariaLabel="Previous page"
        disabled={prevDisabled}
        onClick={() => goToPage(currentPage - 1)}
      />

      {pageItems.map((item, index) =>
        item === "..." ? (
          <span key={`ellipsis-${index}`} className="px-2 text-ink-tertiary" aria-hidden="true">
            ...
          </span>
        ) : (
          <PagerButton
            key={`page-${item}`}
            label={item}
            ariaLabel={`Go to page ${item}`}
            disabled={item === currentPage}
            isCurrent={item === currentPage}
            onClick={() => goToPage(item)}
            ariaCurrent={item === currentPage ? "page" : undefined}
          />
        ),
      )}

      <PagerButton
        label="Next"
        ariaLabel="Next page"
        disabled={nextDisabled}
        onClick={() => goToPage(currentPage + 1)}
      />

      <span className="sr-only" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
};

type PagerButtonProps = {
  label: ReactNode;
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  isCurrent?: boolean;
  ariaCurrent?: "page";
};

const PagerButton = ({
  label,
  onClick,
  disabled,
  ariaLabel,
  isCurrent = false,
  ariaCurrent,
}: PagerButtonProps) => (
  <button
    type="button"
    className={cn(
      pagerButtonClassName,
      isCurrent ? pagerButtonCurrentClassName : pagerButtonEnabledClassName,
    )}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-current={ariaCurrent}
  >
    {label}
  </button>
);

function getPaginationItems(currentPage: number, totalPages: number): PageItem[] {
  const items: PageItem[] = [];
  let hasLeftEllipsis = false;
  let hasRightEllipsis = false;

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const isBoundary = pageNumber === 1 || pageNumber === totalPages;
    const isNearCurrent =
      pageNumber >= currentPage - RANGE_AROUND_CURRENT &&
      pageNumber <= currentPage + RANGE_AROUND_CURRENT;

    if (isBoundary || isNearCurrent) {
      items.push(pageNumber);
      continue;
    }

    if (pageNumber < currentPage && !hasLeftEllipsis) {
      items.push("...");
      hasLeftEllipsis = true;
      continue;
    }

    if (pageNumber > currentPage && !hasRightEllipsis) {
      items.push("...");
      hasRightEllipsis = true;
    }
  }

  return items;
}

function clampPage(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}
