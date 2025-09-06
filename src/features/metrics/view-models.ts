import { MetricSettingsExtendedVM } from "../metric-settings/view-models";

export type MetricDetailCompositeVM = {
  header: MetricHeaderVM;
  settings: MetricSettingsExtendedVM;
};

export type MetricHeaderVM = {
  id: string;
  name: string;
  defaultUnit: string;
  isPublic: boolean;
  description: string | null; // let this be null-safe for UI
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string; icon: string } | null;
};
