/**
 * Subsection header component for consistent styling in subsections.
 * @param title - Subsection title
 * @param className - Additional CSS classes for customization
 */
const SubsectionHeader: React.FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => (
  <div
    className={`mb-4 rounded-xl border border-[#578C9C] bg-[#F7F9FC] px-4 py-2 text-lg font-medium text-[#578C9C] ${className}`}
  >
    {title}
  </div>
);

export default SubsectionHeader;
