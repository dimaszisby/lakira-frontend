import { memo } from "react";

import SubsectionHeader from "./SubsectionHeader";

/**
 * Card component for subsections, providing consistent styling.
 * @param title - Subsection title
 * @param children - Content of the subsection
 * @param className - Additional CSS classes for customization
 */
export const SubsectionCardBase: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = "" }) => (
  <div className={`rounded-xl bg-[#F4F5FB] p-4 ${className}`}>
    <SubsectionHeader title={title} />
    {children}
  </div>
);
SubsectionCardBase.displayName = "SubsectionCard";

const SubsectionCard = memo(SubsectionCardBase);
SubsectionCard.displayName = "SubsectionCard";
export default SubsectionCard;
