import type { ISODateTimeString } from "@/src/types/aliases";

export type MetricLogVM = {
  id: string;
  metricId: string;
  logValue: number;
  loggedAt: string;
  type: "manual" | "automatic";
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  deletedAt?: ISODateTimeString | null;
};
