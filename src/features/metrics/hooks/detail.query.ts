import { useQuery } from "@tanstack/react-query";

import { toMetricSettingsVM } from "@/features/metric-settings/mappers";

import { metricsKeys } from "../keys";
import { toMetricHeaderVM } from "../mappers";
import { getUserMetricDetails } from "../metric.api";

export function useMetricDetailComposite(metricId: string) {
  return useQuery({
    queryKey: metricsKeys.detail(metricId, ["category", "settings"]),
    queryFn: () => getUserMetricDetails(metricId, { includes: ["category", "settings"] }),
    select: (dto) => ({
      header: toMetricHeaderVM(dto),
      settings: dto.settings ? toMetricSettingsVM(dto.settings) : null,
    }),
    enabled: !!metricId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export default useMetricDetailComposite;
