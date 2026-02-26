"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { MetricSettingsExtendedVM } from "../view-models";
import MetricSettingsForm from "./MetricSettingsForm";

const MetricSettingsFormDialog = ({
  metricId,
  initialSettings,
}: {
  metricId: string;
  initialSettings: MetricSettingsExtendedVM | null;
}) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();

    setTimeout(() => {
      router.refresh();
    }, 0);
  }, [router]);

  return (
    <MetricSettingsForm
      metricId={metricId}
      initialSettings={initialSettings}
      onClose={handleClose}
    />
  );
};

export default MetricSettingsFormDialog;
