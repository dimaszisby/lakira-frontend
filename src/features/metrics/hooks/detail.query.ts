import { useQuery } from "@tanstack/react-query";

import type { MetricSettingsExtendedVM } from "../../metric-settings/view-models";
import { metricsKeys } from "../keys";
import { toMetricHeaderVM, toMetricSettingsVM } from "../mappers";
import { getUserMetricDetails } from "../metric.api";

export default function useMetricDetailComposite(metricId: string) {
  return useQuery({
    queryKey: metricsKeys.detail(metricId, ["category", "settings"]),
    queryFn: () => getUserMetricDetails(metricId, { includes: ["category", "settings"] }),
    select: (dto) => ({
      header: toMetricHeaderVM(dto),
      settings: toMetricSettingsVM(dto) as MetricSettingsExtendedVM,
    }),
    enabled: !!metricId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
