import Card from "@/ui/Card";
import Visualization from "@/ui/Visualization";

const VisualizationSection = ({
  metricId,
  goalValue,
}: {
  metricId: string;
  goalValue: number | null;
}) => {
  return (
    <Card>
      <Visualization metricId={metricId} goalValue={goalValue}></Visualization>
    </Card>
  );
};

export default VisualizationSection;
