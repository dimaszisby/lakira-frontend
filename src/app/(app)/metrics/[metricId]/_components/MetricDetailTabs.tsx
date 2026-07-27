"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { metricRoutes } from "@/lib/routes";

import { useMetricDetail } from "./MetricDetailContext";

const tabs = [
  {
    key: "overview",
    label: "Overview",
    href: (metricId: string) => metricRoutes.overview(metricId),
    isMatch: (path: string, base: string) => path === base,
  },
  {
    key: "logs",
    label: "Logs",
    href: (metricId: string) => metricRoutes.logs(metricId),
    isMatch: (path: string, base: string) => path.startsWith(`${base}/logs`),
  },
  {
    key: "settings",
    label: "Settings",
    href: (metricId: string) => metricRoutes.settings(metricId),
    isMatch: (path: string, base: string) => path.startsWith(`${base}/settings`),
  },
] as const;

const MetricDetailTabs = () => {
  const pathname = usePathname();
  const { metricId } = useMetricDetail();

  const basePath = metricRoutes.detail(metricId);
  const activeTabKey = tabs.find((tab) => tab.isMatch(pathname, basePath))?.key;

  return (
    <div className="w-full px-4">
      <nav aria-label="Metric tabs" className="flex items-end gap-1 border-b border-border/80">
        {tabs.map((tab, index) => {
          const isActive = tab.key === activeTabKey;
          const nextTab = tabs[index + 1];
          const hasActiveNeighbor =
            nextTab?.key === activeTabKey || tabs[index - 1]?.key === activeTabKey;

          return (
            <div key={tab.key} className="relative flex-1">
              <Link
                href={tab.href(metricId)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex w-full items-center justify-center rounded-t-xl border px-4 text-center transition-all ${
                  isActive
                    ? "-mb-px border-border border-b-surface bg-brand-primary/10 py-3 text-sm font-semibold text-brand-primary shadow-sm"
                    : "border-border/70 border-b-border bg-surface2 py-2.5 text-sm font-medium text-ink-secondary  hover:bg-surface hover:text-ink"
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
              </Link>
              {index < tabs.length - 1 ? (
                <span
                  aria-hidden
                  className={`pointer-events-none absolute right-0 top-3 h-5 w-px ${
                    hasActiveNeighbor ? "bg-transparent" : "bg-border/70"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default MetricDetailTabs;
