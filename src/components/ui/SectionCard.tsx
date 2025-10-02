import SectionHeader from "./SectionHeader";

/**
 * Card component for sections, providing consistent styling.
 * @param title - Optional section title
 * @param headerComponent - Optional React node for custom header content
 * @param children - Content of the section
 * @param className - Additional CSS classes for customization
 */
const SectionCard: React.FC<{
  title?: string;
  headerComponent?: React.ReactNode | undefined;
  children: React.ReactNode;
  className?: string;
}> = ({ title, headerComponent, children, className = "" }) => {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow ${className}`}>
      <SectionHeader title={title}>{headerComponent}</SectionHeader>
      {children}
    </div>
  );
};

export default SectionCard;
