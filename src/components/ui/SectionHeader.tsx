/**
 * Section header component for consistent styling across sections.
 * @param title - Section title
 * @param action - Optional React node (button, menu, etc) to show at right
 */
const SectionHeader: React.FC<{
  title?: string;
  children?: React.ReactNode | undefined;
  className?: string;
}> = ({ title, children, className = "" }) => {
  const bm = title && children ? "mb-4" : undefined;

  return (
    <div className={`flex items-center justify-between ${bm} ${className}`}>
      {title ? <h2 className="text-xl font-bold">{title}</h2> : null}
      {children}
    </div>
  );
};

export default SectionHeader;
