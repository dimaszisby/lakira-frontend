import SectionCard from "@/ui/SectionCard";
import Visualization from "@/ui/Visualization";

const VisualizationSection = ({
  metricId,
  goalValue,
}: {
  metricId: string;
  goalValue: number | null;
}) => {
  return (
    <SectionCard>
      <Visualization metricId={metricId} goalValue={goalValue}></Visualization>
    </SectionCard>
  );
};

export default VisualizationSection;
