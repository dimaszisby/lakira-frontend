"use client";

import Link from "next/link";
import { memo } from "react";

import type { MetricDetailCompositeVM } from "@/features/metrics/view-models";
import Card from "@/ui/Card";

interface Props {
  category: MetricDetailCompositeVM["header"]["category"];
  metricName: string;
}

export const BreadcrumbsBase = ({ category, metricName }: Props) => {
  return (
    <Card size="xs" className="w-full">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-row items-center text-caption text-ink-tertiary">
          <li>
            <Link href="/metrics" className="hover:underline">
              Metric Library
            </Link>
            <span className="mx-2">/</span>
          </li>

          {category !== null ? (
            <li>
              <Link href={`/metric-categories/${category.id}`}>{category.name}</Link>
              <span className="mx-4">/</span>
            </li>
          ) : (
            <li>
              <span>Uncategorized</span>
              <span className="mx-4">/</span>
            </li>
          )}

          <li className="text-brand-primary">{metricName}</li>
        </ol>
      </nav>
    </Card>
  );
};
BreadcrumbsBase.displayName = "Breadcrumbs";

const Breadcrumbs = memo(BreadcrumbsBase);
Breadcrumbs.displayName = "Breadcrumbs";
export default Breadcrumbs;
