import MetricSettingsSection from "../_components/MetricSettingsSection";

const MetricSettingsPage = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const resolvedSearchParams = (await searchParams) ?? {};
  const panelParam = resolvedSearchParams.panel;
  const panel = Array.isArray(panelParam) ? panelParam[0] : panelParam;

  return (
    <div className="flex flex-col gap-4">
      <MetricSettingsSection panel={panel} />
    </div>
  );
};

export default MetricSettingsPage;
