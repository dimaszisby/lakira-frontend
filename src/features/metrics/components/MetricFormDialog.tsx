"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { MetricFormInitial } from "@/features/metrics";
import type { ModalTitleLevel } from "@/ui/Modal";

import MetricForm from "./MetricForm";

type MetricFormDialogProps = {
  initialMetric: MetricFormInitial | null;
  /** `h1` from a route that is only this dialog, `h2` from its intercept (ADR-0032). */
  titleAs?: ModalTitleLevel;
};

const MetricFormDialog = ({ initialMetric, titleAs }: MetricFormDialogProps) => {
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();

    // Ensure parent route data is refreshed after closing the modal route.
    setTimeout(() => {
      router.refresh();
    }, 0);
  }, [router]);

  return <MetricForm initialMetric={initialMetric} onClose={handleClose} titleAs={titleAs} />;
};

export default MetricFormDialog;
