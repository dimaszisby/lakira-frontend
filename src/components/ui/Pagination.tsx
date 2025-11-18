import { cn } from "@/lib/cn";

type PaginationProps = {
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  total?: number;
  canPrev?: boolean;
  canNext?: boolean;
};

export const Pagination = ({
  page,
  total,
  pageSize,
  onChange,
  canPrev,
  canNext,
}: PaginationProps) => {
  const totalPages =
    typeof total === "number" ? Math.max(1, Math.ceil(total / pageSize)) : undefined;

  // button styling
  const btnBaseStyle = "rounded-lg px-3 py-1";
  const disabledStyle = "cursor-not-allowed opacity-50";
  const enabledStyle = "text-ink-secondary hover:bg-surface2";

  // If total page unknown, show simple Prev/Next controls
  if (!totalPages) {
    const prevDisabled = typeof canPrev === "boolean" ? !canPrev : page <= 1;
    // Allow Next unless parent disables via canNext
    const nextDisabled = typeof canNext === "boolean" ? !canNext : false;

    return (
      <nav className="flex items-center justify-center space-x-1" aria-label="Pagination">
        <button
          className={cn(btnBaseStyle, prevDisabled ? disabledStyle : enabledStyle)}
          onClick={() => onChange(page - 1)}
          disabled={prevDisabled}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-ink-secondary" aria-live="polite">
          Page {page}
        </span>
        <button
          className={cn(btnBaseStyle, nextDisabled ? disabledStyle : enabledStyle)}
          onClick={() => onChange(page + 1)}
          disabled={nextDisabled}
          aria-label="Next page"
        >
          Next
        </button>
      </nav>
    );
  }

  // Known total: render full pager with numbers + ellipses
  const pageNumbers = getPaginationItems(page, totalPages);

  return (
    <nav className="flex items-center justify-center space-x-1" aria-label="Pagination">
      <button
        className={cn(btnBaseStyle, page === 1 ? disabledStyle : enabledStyle)}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        Prev
      </button>

      {pageNumbers.map((num, idx) =>
        num === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-ink-tertiary" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={`page-${num}`}
            className={cn(
              btnBaseStyle,
              page === num ? "bg-brand-primary/20 font-bold text-brand-primary" : enabledStyle,
            )}
            onClick={() => onChange(num)}
            disabled={page === num}
            aria-current={page === num ? "page" : undefined}
            aria-label={`Page ${num}`}
          >
            {num}
          </button>
        ),
      )}

      <button
        className={cn(btnBaseStyle, page === totalPages ? disabledStyle : enabledStyle)}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
};

// Helper
function getPaginationItems(
  currentPage: number,
  totalPages: number,
  range = 2,
): Array<number | "..."> {
  const items: Array<number | "..."> = [];
  let lastPushed: number | "..." | null = null;

  for (let i = 1; i <= totalPages; i++) {
    // Always show first and last page, and pages within the range of the current page
    if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
      items.push(i);
      lastPushed = i;
    } else if (lastPushed !== "...") {
      // Insert ellipsis if not already inserted
      items.push("...");
      lastPushed = "...";
    }
  }
  return items;
}
