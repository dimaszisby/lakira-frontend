/**
 * SortChip.tsx
 * - Stateless Component
 *
 * @description
 * This function returns a CSS class string based on the sort order.
 * If the sort order is "ASC" or "DESC", it returns a class for active sorting.
 * If the sort order is null, it returns a class for inactive sorting.
 */

function getSortOrderClass(sortOrder: "ASC" | "DESC" | null) {
  switch (sortOrder) {
    case "ASC":
      return "bg-blue-500 text-white";
    case "DESC":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-200 text-gray-700 hover:bg-gray-300";
  }
}

const SortChip: React.FC<{
  label: string;
  sortOrder: "ASC" | "DESC" | null;
  onClick: () => void;
  customChildren?: React.ReactNode;
}> = ({ label, sortOrder, onClick, customChildren }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mr-2 px-3 py-2 ${getSortOrderClass(
        sortOrder,
      )} rounded-2xl hover:underline focus:outline-none`}
    >
      {customChildren ? (
        customChildren
      ) : (
        <>
          {label}
          {sortOrder ? (
            <span className="ml-1 text-xs">{sortOrder === "ASC" ? "▲" : "▼"}</span>
          ) : null}
        </>
      )}
    </button>
  );
};

export default SortChip;
