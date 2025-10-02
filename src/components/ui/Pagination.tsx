type PaginationProps = {
  page: number;
  pageSize: number;
  onChange: (page: number) => void;
  total?: number; // Optional when total count is unknown (cursor w/o includeTotal)
  canPrev?: boolean; // Optional explicit guards when total is unknown
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
  const disabledStyle = "cursor-not-allowed opacity-50";
  const enabledStyle = "text-gray-700 hover:bg-gray-200";

  // IF total page unknown => show simple Prev/Next controls
  if (!totalPages) {
    const prevDisabled = typeof canPrev === "boolean" ? !canPrev : page <= 1;
    // Dont know total => allow Next unless parent disables via canNext
    const nextDisabled = typeof canNext === "boolean" ? !canNext : false;

    return (
      <nav className="mt-8 flex items-center justify-center space-x-1">
        <button
          className={`rounded-lg px-3 py-1 ${prevDisabled ? disabledStyle : enabledStyle}`}
          onClick={() => onChange(page - 1)}
          disabled={prevDisabled}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-gray-600" aria-live="polite">
          Page {page}
        </span>
        <button
          className={`rounded-lg px-3 py-1 ${prevDisabled ? disabledStyle : enabledStyle}`}
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
  const pageNumbers: Array<number | "..."> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(page - i) <= 2) {
      pageNumbers.push(i);
    } else if ((i === 2 && page > 4) || (i === totalPages - 1 && page < totalPages - 3)) {
      // avoid duplicate "..." entries
      if (pageNumbers[pageNumbers.length - 1] !== "...") {
        pageNumbers.push("...");
      }
    }
  }

  return (
    <nav className="mt-8 flex items-center justify-center space-x-1">
      <button
        className={`rounded-lg px-3 py-1 ${page === 1 ? disabledStyle : enabledStyle}`}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        Prev
      </button>

      {pageNumbers.map((num, idx) =>
        num === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={`page-${num}`}
            className={`rounded-lg px-3 py-1 ${
              page === num
                ? "bg-purple-200 font-bold text-purple-800"
                : "text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => onChange(num)}
            disabled={page === num}
            aria-current={page === num ? "page" : undefined}
          >
            {num}
          </button>
        ),
      )}

      <button
        className={`rounded-lg px-3 py-1 ${page === totalPages ? disabledStyle : enabledStyle}`}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
};
