export type BucketAlias = "1h" | "1d" | "1w" | "1m" | "1y";
export type FillMode = "none" | "zero" | "nan";

export type VizSeries = {
  bucketStartISO: string;
  value: number | null;
};

export type VizStats = {
  average: number | null;
  min: number | null;
  max: number | null;
  count: number;
};

export type VizMeta = {
  metricId: string;
  unit: string;
  bucket: BucketAlias;
  tz: string;
  range: { startISO: string; endISO: string };
};

export type VizResponse = {
  series: VizSeries[];
  stats: VizStats;
  meta: VizMeta;
};

export type VizQuery =
  | {
      // relative
      last: `${number}${"h" | "d" | "w" | "m" | "y"}`;
      bucket: BucketAlias;
      tz?: string;
      fill?: FillMode;
    }
  | {
      // absolute
      start: string; // ISO
      end: string; // ISO
      bucket: BucketAlias;
      tz?: string;
      fill?: FillMode;
    };

export type RelativeLast = `${number}${"h" | "d" | "w" | "m" | "y"}`;

export type TimeRangeValue =
  | { mode: "relative"; last: RelativeLast }
  | { mode: "absolute"; start: string; end: string };

// * Dashboard Visualization
export type DashboardVizItem = {
  metricId: string;
  name: string;
  unit: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  priority: number | null;
  series: { bucketStartISO: string; value: number | null }[];
  stats: {
    average: number | null;
    min: number | null;
    max: number | null;
    count: number;
  };
};

export type DashboardVizResponse = {
  items: DashboardVizItem[];
  meta: {
    bucket: BucketAlias;
    tz: string;
    range: { startISO: string; endISO: string };
    count: number; // items.length
  };
};
