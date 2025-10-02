import { memo } from "react";

export const OverlineLabelBase = ({ text }: { text: string }) => (
  <span className="block text-xs font-semibold uppercase text-[#578C9C]">{text}</span>
);
OverlineLabelBase.displayName = "OverlineLabel";

const OverlineLabel = memo(OverlineLabelBase);
OverlineLabel.displayName = "OverlineLabel";
export default OverlineLabel;
